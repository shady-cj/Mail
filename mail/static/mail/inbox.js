let composeSubject,composeRecipient,alertMessage,mail_type,mail_sendto,mail_sender,mail_body,mail_subject,mail_timestamp,composeBody;
document.addEventListener('DOMContentLoaded', function() {
	
	
	alertMessage = document.querySelector("#alertmessage")
	composeSubject= document.querySelector('#compose-subject')
	composeRecipient = document.querySelector('#compose-recipients')
	composeBody = document.querySelector('#compose-body')







	document.querySelector("#compose-form").onsubmit = function(){

		// convert the string in body of the letter to DOM elements in order to remove unnecessary classes and attributes
		let body=composeBody.innerHTML;
		let recipient=composeRecipient.value;
		let subject=composeSubject.value;
		let doc = new DOMParser().parseFromString(body, "text/html");
	
		doc.querySelectorAll('.reply-content').forEach(function(eachdiv){
			eachdiv.classList.remove('reply-content')
			eachdiv.contentEditable = 'false'
			
		})
		doc.querySelectorAll('.email-text-container').forEach(function(eachdiv){
			eachdiv.classList.remove('email-text-container')

		})
		let docToString= new XMLSerializer().serializeToString(doc)
		body=docToString.replace('<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>','').replace('</body></html>','')
		

		// posting the mail

		fetch("/emails",{
			method:"POST",
			body:JSON.stringify({
				recipients:recipient,
				body:body,
				subject:subject
			})
		})
		.then(response=>response.json())
		.then(result=>{
			if (result.error){
				message =result.error
				alertMessage.classList.add('errorMsg')
			}else{
				message= result.message
			}
			alertMessage.innerHTML = message
			alertMessage.style.display = "block"
			setTimeout(function(){
				alertMessage.style.display = "none"
				if (alertMessage.classList.contains('errorMsg')){
					alertMessage.classList.remove('errorMsg')
				}
			}, 4000)

			

			load_mailbox('sent')
		})

		
		return false;
	}


	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);
	
	// By default, load the inbox
	load_mailbox('inbox');
	});




	function compose_email() {

		// convert the div back to a textarea

		composeBody.contentEditable = 'true'

		// resize the height of the div
		
		composeBody.style.height = 'auto'

		// Show compose view and hide other views
		document.querySelector('#emails-view').style.display = 'none';
		document.querySelector('#compose-view').style.display = 'block';
		document.querySelector('#emails-content').style.display = 'none';

		// Clear out composition fields
		composeRecipient.value = '';
		composeSubject.value = '';
		composeBody.innerHTML = '';



		// Enable the recipient and subject fields
		composeSubject.disabled = false
		composeRecipient.disabled = false
		
	}


	// loading the mailbox
	function load_mailbox(mailbox) {
	mail_type = mailbox
	fetch(`/emails/${mail_type}`)
	.then(response => response.json())
	.then(result => {
			result.forEach(function(content){

				let div=document.createElement("div")
				div.className = "eachmail"
				div.innerHTML = `<b>${content.sender}</b> <span style = 'display:inline-block; margin-left:35px'> ${content.subject} </span> <div style="float:right;color:lightgray">${content.timestamp}</div>`
				div.addEventListener('click',()=>{loademails(content.id,mail_type)})
				if (content.read){
					div.style.backgroundColor = "gray"
				}
				else{
					div.style.backgroundColor = "white"
				}
				document.querySelector('#emails-view').append(div)
				
			})
		})
	
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#emails-content').style.display = 'none';

	// Show the mailbox name
	document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
	}



	function loademails(email_id,email_type){


	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#emails-content').style.display = 'block';
	fetch(`/emails/${email_id}`)
	.then(response=>response.json())
	.then(result=>{

		

		mail_subject = result.subject;
		mail_timestamp = result.timestamp;
		mail_body = result.body;
		mail_sender = result.sender;
		if (email_type === "inbox"){
			mail_sendto = result.sender;
			document.querySelector('#emails-content').innerHTML =`<b>From</b>:${result.sender}<br><b>To</b>:You<br><b>Subject</b>:${result.subject}<br><b>Timestamp</b>:${result.timestamp}<br><button onclick="mail_reply()" class="btnstyle">reply</button><button onclick="mail_archive(${email_id},true)" class="btnstyle">Archive</button><hr><br>${result.body}`;
		}
		else if (email_type === "archive"){
			document.querySelector('#emails-content').innerHTML = `<b>From</b>:${result.sender}<br><b>To</b>:${result.recipients}<br><b>Subject</b>:${result.subject}<br><b>Timestamp</b>:${result.timestamp}<br><button onclick="mail_archive(${email_id},false)" class="btnstyle">Unarchive</button><hr><br>${result.body}`;
		}
		else{
			mail_sendto = result.recipients;
			document.querySelector('#emails-content').innerHTML = `<b>From</b>:${result.sender}<br><b>To</b>:${result.recipients}<br><b>Subject</b>:${result.subject}<br><b>Timestamp</b>:${result.timestamp}<br><button onclick="mail_reply()" class="btnstyle">reply</button><hr><br>${result.body}<hr>`;
		}


	})
	
	fetch(`/emails/${email_id}`,{
	method: 'PUT',
	body: JSON.stringify({read:true})
	})
	.then(response=>response.text())
	.then(result=>{console.log('successful')})
	


	}





	function mail_archive(mail_id,val){
	fetch(`/emails/${mail_id}`,{
	method: 'PUT',
	body: JSON.stringify({archived:val})
	})
	.then(response=>response.text())

	.then(data=>{
			load_mailbox('inbox')
	})

	}





	function mail_reply(){
		document.querySelector('#emails-view').style.display = 'none';
		document.querySelector('#compose-view').style.display = 'block';
		document.querySelector('#emails-content').style.display = 'none';

		if(mail_subject.substr(0,3) === "Re:"){
			composeSubject.value = mail_subject;
			
		}
		else{
			composeSubject.value = `Re:${mail_subject}`
		}
		

		

		composeRecipient.value = mail_sendto;

		
		
		// convert the div to ineditable to avoid users from mistakenly clearing out the field
		composeBody.contentEditable = 'false'

		composeBody.innerHTML = `<div class='email-text-container'>
									On ${mail_timestamp} <b>${mail_sender}</b> wrote:<div class='mail-body'><i>${mail_body}</i></div>
								</div>
								<div class = 'reply-content' contenteditable='true'>
								</div>
								`;
		// to increase the height of the div due to the prefilled text
		let getHeight = +getComputedStyle(document.querySelector('.email-text-container')).height.replace('px','') + 400
		composeBody.style.height = `${getHeight}px`
		console.log(getHeight)
		

		
		//  aim here is to resize the div as the user types
		let composeBodyHeight = +getComputedStyle(composeBody).height.replace('px','')
		
		let emailTextContainer = document.querySelector(".email-text-container")						
		let replyContent = document.querySelector(".reply-content")
		let conHeight = +getComputedStyle(emailTextContainer).height.replace('px','')
		let minHeight= getHeight-24;
		let currentHeight = getHeight-24;
		let heightUsed = conHeight + 32
		let replyContentHeight;
		let prevConHeight;

		replyContent.addEventListener('keyup',function(){

			enterKeyListener()

			
		})
		replyContent.addEventListener('keydown', function(e){
			if (e.keyCode === 8){
				replyContentHeight = +getComputedStyle(replyContent).height.replace('px','')
				totalHeightUsedUp = replyContentHeight + heightUsed
				if( totalHeightUsedUp > minHeight && totalHeightUsedUp < prevConHeight){
					composeBodyHeight -= 25;
					currentHeight -= 25;
					composeBody.style.height = `${composeBodyHeight}px`
				}
			
				

			}
			if (e.keyCode === 13){
				enterKeyListener()
			}

		})

		// disable the recipient and subject input field to prevent the user from editing
		composeSubject.disabled = true
		composeRecipient.disabled = true	
		





		function enterKeyListener(){
			replyContentHeight = +getComputedStyle(replyContent).height.replace('px','')
	
			totalHeightUsedUp = replyContentHeight + heightUsed
			
	
			if( totalHeightUsedUp > minHeight && totalHeightUsedUp > currentHeight){
				composeBodyHeight += 40;
				currentHeight += 40;
				composeBody.style.height = `${composeBodyHeight}px`
				prevConHeight = totalHeightUsedUp
			}
		}

	}
