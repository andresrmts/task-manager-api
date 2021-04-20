const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'andresrmts@gmail.com',
    subject: 'Thanks for joining us!',
    text: `Welcome to the app, ${name}! Let me know how you like the app!`
  })
}

const sendDeleteEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'andresrmts@gmail.com',
    subject: `We are sad to see you leave, ${name}`,
    text: `Hey, ${name}, too bad you are leaving! If you don't mind, please let us know why you've deleted your account!`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendDeleteEmail
}