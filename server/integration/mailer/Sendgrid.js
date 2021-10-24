const Mailer = require("./Mailer");
const sgMail = require("@sendgrid/mail");


function sendgridSendMail(msg) {
    let isSent = true;
    sgMail.send(msg, (error, result) => {
        if (error) {
            isSent = false;
        } 
    });
    return isSent;
}

class Sendgrid extends Mailer {
  sendMail() {
    try {
        sgMail.setApiKey(process.env.SENDGRID_KEY);
        const msg = {
            to: this.data.receiver,
            from: this.data.sender,
            templateId: this.data.templateId,
            dynamic_template_data: {
                reset_url: this.data.reset_url,
            },
            hideWarnings: true
        };

        //send the email
        const sent = sendgridSendMail(msg);
        return sent

    } catch (error) {
        return false;
    }
  }

  
}

module.exports = Sendgrid;