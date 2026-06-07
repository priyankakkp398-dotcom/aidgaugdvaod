import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const sendEmail = async (templateParams) => {
  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    return { success: true, message: 'Form submitted successfully! Data sent to email.' }
  } catch (error) {
    console.error('EmailJS error:', error)
    return { success: false, message: 'Failed to send data. Please try again.' }
  }
}
