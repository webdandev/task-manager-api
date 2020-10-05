const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'bonab3716@gmail.com',
    subject: 'Welcome to our app!',
    text: `Welcome ${name}, were very happy to have you among us`,
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'bonab3716@gmail.com',
    subject: 'We are sad to see you go',
    text: `Hello ${name}, can you please let us know how we disappointed you, so maybe we'll
     be be able to do better next time? We already miss you and thank you for being with us so far`  
  })
}

module.exports = {
  sendWelcomEmail,  //shorthand syntax
  sendCancelationEmail
}