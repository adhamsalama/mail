document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector("#email-details").style.display = "none";

  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  console.log(mailbox);
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#email-details").style.display = "none";

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      //console.log(emails);

      // ... do something else with emails ...
      for (let i = 0; i < emails.length; i++)
       {
          html_for_email(emails[i], mailbox);
      }
      
  });

}

function send_email() {
  let form = document.querySelector("#compose-form");
  let recipients = document.querySelector("#compose-recipients").value;
  let subject = document.querySelector("#compose-subject").value;
  let body = document.querySelector("#compose-body").value;
  console.log(recipients);
  console.log(subject);
  console.log(body);
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox("sent");
  });

  return false;
  
}


function view_email(email_id, mailbox) {
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(mailbox);
      // ... do something else with email ...
      let content = `<div class="row row-cols-1">
                          <div class="col"><strong>From:</strong> ${email["sender"]}</div>
                          <div class="col"><strong>To:</strong> ${email["recipients"]}</div>
                          <div class="col"><strong>Subject:</strong> ${email["subject"]}</div>
                          <div class="col"><button onclick="reply_to_email('${email["id"]}');" class="btn btn-primary" type="submit">Reply</button></div>`
      if (mailbox == "inbox")
        content +=        `<div class="col"><button onclick="archive_email(${email['id']}, ${true});" class="btn btn-primary mt-2" type="submit">Archive</button></div>`;
      else if (mailbox == "archive")
      content +=          `<div class="col"><button onclick="archive_email(${email['id']}, ${false});" class="btn btn-primary mt-2" type="submit">Unarchive</button></div>`;
      content += 
                          `<hr>
                          <div class="col"><pre>${email["body"]}</pre></div>
                      </div>`
      document.querySelector("#email-details").innerHTML = content;
      document.querySelector("#emails-view").style.display = "none";
      document.querySelector("#compose-view").style.display = "none";
      document.querySelector("#email-details").style.display = "block";
      fetch('/emails/' + email_id, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
      .then(result => console.log(result));
      
  });
}

function archive_email(email_id, archive) {
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive
    })
  })
  .then(response => {
    console.log("archived");
    load_mailbox("inbox");
  })
  
}

function reply_to_email(email_id) {
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => { 
    console.log("am here", email);
    document.querySelector('#compose').click();

  if (email["subject"].slice(0, 3) !== "Re:" ) {
    email["subject"] = "Re:" + email["subject"];
    document.querySelector('#compose-recipients').value = email["sender"];
  }
  else {
    document.querySelector('#compose-recipients').value = email["recipients"];
  }
  document.querySelector('#compose-subject').value = email["subject"];
  document.querySelector('#compose-body').value = `\n\nOn ${email["timestamp"]} ${email["sender"]} wrote: "${email["body"]}"\n`;
  })
  
}
function html_for_email(email, mailbox) {
  let sender = email["sender"];
  let subject = email["subject"];
  let body = email["body"];
  let stamp = email["timestamp"];
  /*console.log(sender);
  console.log(subject);
  console.log(body);
  console.log(email["read"]);*/
  let sender_reciever = "";
  if (mailbox == "sent")
    sender_reciever = email["recipients"];
  else
    sender_reciever = email["sender"];
  let email_html = document.createElement("div");
  //email_html.style.display = "block";
  //email_html.href = "#";
  //email_html.onclick = console.log;
  let read_unread_class = "";
  if (email["read"] == true)
    read_unread_class = "secondary";
  else
    read_unread_class = "light";
  email_html.innerHTML = ` <a onclick="view_email(${email["id"]}, '${mailbox}');" style="display: block" href="#">
                            <div class="alert alert-${read_unread_class}" role="alert" style="border: 1px black solid; color: black;">
                              <div class="row row-cols-3" style="margin-left: 5px; padding: 10px">
                                <div class="row">
                                  ${sender_reciever}
                                </div>
                                <div class="row">
                                  ${subject}
                                </div>
                                <div class="row" style="margin-right: 0px">
                                  ${stamp}
                                </div>
                              </div>
                            </div>
                            </div>
                          </a>`
  let view = document.querySelector("#emails-view");
  view.append(email_html);
}