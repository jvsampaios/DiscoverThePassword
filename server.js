const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = 3000;
let password = '';
let hints = [];

function generatePassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_+=';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let newPassword = '';

  while (newPassword.length < 8 || newPassword.length >= 30) {
    newPassword = '';

    for (let i = 0; i < 5; i++) {
      newPassword += characters[Math.floor(Math.random() * characters.length)];
    }

    const year = Math.floor(Math.random() * (2022 - 1900 + 1)) + 1900;
    const month = months[Math.floor(Math.random() * months.length)];

    const specialCharIndex = Math.floor(Math.random() * newPassword.length);
    newPassword = newPassword.substring(0, specialCharIndex) + characters[Math.floor(Math.random() * characters.length)] + newPassword.substring(specialCharIndex);

    const yearIndex = Math.floor(Math.random() * (newPassword.length - 1)) + 1;
    newPassword = newPassword.substring(0, yearIndex) + year + newPassword.substring(yearIndex);

    const monthIndex = Math.floor(Math.random() * (newPassword.length - 1)) + 1;
    newPassword = newPassword.substring(0, monthIndex) + month + newPassword.substring(monthIndex);
  }

  return newPassword;
}

function startGame() {
  password = generatePassword();
  console.log('Senha gerada:', password);
  hints = [
    `Número de caracteres: ${password.length}`,
    `Um ano que já passou é formado em algum momento da senha.`,
    `Tem ${password.match(/[A-Z]/g).length} letras maiúsculas`,
    `Um mês do ano é formado em algum momento da senha.`,
    `A soma dos dígitos numéricos é igual a ${sumDigits(password)}`,
    `A senha inicia com ${password[0]}`,
    `A senha termina com ${password[password.length - 1]}`,
    `A senha tem ${password.match(/[^A-Za-z0-9]/g)?.length || 0} algarismos especiais`,
    `A senha tem ${password.match(/[0-9]/g)?.length || 0} dígitos numéricos`
  ];
}

io.on('connection', (socket) => {
  startGame();

  socket.on('guess', (guess) => {
    if (guess === password) {
      socket.emit('hint', 'Parabéns! Você acertou a senha!');
      startGame();
    } else {
      if (hints.length > 0) {
        const hint = hints.shift(); // Remove a primeira dica do array
        socket.emit('hint', hint);
      } else {
        socket.emit('hint', 'Sem mais dicas disponíveis.');
      }
    }
  });

  socket.on('giveUp', () => {
    socket.emit('showPassword', password);
    startGame();
    console.log('Ih, ele desistiu');
    io.emit('giveUpMessage', 'Ih, ele desistiu');
    hints = []; // Redefine o array de dicas
  });
});

function sumDigits(str) {
  let sum = 0;
  const digits = str.match(/\d/g);
  if (digits) {
    digits.forEach((digit) => {
      sum += parseInt(digit, 10);
    });
  }
  return sum;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(port, () => {
  console.log(`Servidor ouvindo na porta ${port}`);
});
