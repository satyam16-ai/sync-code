document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('show');
});

document.getElementById('create-room-btn').addEventListener('click', () => {
    document.getElementById('create-room-popup').style.display = 'flex';
});

document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('create-room-popup').style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == document.getElementById('create-room-popup')) {
        document.getElementById('create-room-popup').style.display = 'none';
    }
});

document.querySelector('.chatbot-button').addEventListener('click', () => {
    document.getElementById('chatbot-popup').style.display = 'flex';
});

document.getElementById('close-chatbot').addEventListener('click', () => {
    document.getElementById('chatbot-popup').style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == document.getElementById('chatbot-popup')) {
        document.getElementById('chatbot-popup').style.display = 'none';
    }
});

document.getElementById('send-chatbot-message').addEventListener('click', sendMessage);
document.getElementById('chatbot-input').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const inputField = document.getElementById('chatbot-input');
    const message = inputField.value.trim();
    if (message) {
        displayMessage('You', message);
        inputField.value = '';
        fetchGeminiResponse(message);
    }
}

function displayMessage(sender, message) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function fetchGeminiResponse(message) {
    try {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (data.reply) {
            displayMessage('Chatbot', data.reply);
        } else {
            displayMessage('Chatbot', 'Sorry, I did not understand that.');
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Chatbot', 'Sorry, there was an error processing your request.');
    }
}