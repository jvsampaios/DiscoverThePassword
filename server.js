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

  while (newPassword.length < 8 || newPassword.length >= 15) {
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
    `Opa, esqueci de dizer que o mês do ano está em Inglês. Mas você é poliglota, não é?`,
    `A soma dos dígitos numéricos é igual a ${sumDigits(password)}`,
    `A senha inicia com ${password[0]}`,
    `Relembra as senhas que você já tentou`,
    `A senha termina com ${password[password.length - 1]}`,
    `A senha tem ${password.match(/[^A-Za-z0-9]/g)?.length || 0} algarismos especiais`,
    `A senha tem ${password.match(/[0-9]/g)?.length || 0} dígitos numéricos`,
    `A senha tem ${password.match(/[A-Z]/g)?.length || 0} letras maiúsculas`,
    `Eu já tinha dito essa, né?`,
    `O 2º caractere da senha é: ${password[1]}`,
    `Calmaaa, minhas dicas tão acabando`,
    `A senha tem ${password.match(/[a-z]/g)?.length || 0} letras minúsculas`,
    `A senha tem ${password.match(/[A-Za-z]/g)?.length || 0} letras`,
    `A senha tem ${password.match(/[0-9]/g)?.length || 0} números`,
    `O 3º caractere da senha é: ${password[2]}`,
    `O 4º caractere da senha é: ${password[3]}`
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
    console.log('Ih, ele desistiu');
    io.emit('giveUpMessage', 'Ih, ele desistiu');
    hints = []; // Redefine o array de dicas
  });

  socket.on('halfPassword', () => {
    socket.emit('showHalfPassword', password);
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
