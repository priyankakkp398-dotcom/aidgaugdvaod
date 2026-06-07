import { Link } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
        <img src="/kotak.png" alt="Kotak Bank" className="h-16 sm:h-20 mx-auto mb-4 sm:mb-6" />
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Admin Portal</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6">
          Admin panel is not available in direct-to-email mode.
        </p>
        <p className="text-gray-400 text-xs sm:text-sm mb-6">
          All form submissions are sent directly to your configured Gmail address via EmailJS. 
          Check your email inbox for new submissions.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
