const express = require('express');
const { Client } = require('ssh2');
const fs = require('fs');

const app = express();
const port = 3000;

// Configuración SSH
const sshConfig = {
  host: 'ssh-natureza.alwaysdata.net',
  port: 22,
  username: 'natureza_anon',
  password: '(123456)', 
};

// Ruta del archivo en el servidor remoto
const remoteFilePath = 'cmeza.xlsx'; 

// Función para obtener el archivo desde el servidor SSH
function getFileFromSSH() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log('Conexión SSH establecida');

      conn.sftp((err, sftp) => {
        if (err) {
          reject('Error en la conexión SFTP: ' + err);
        }

        // Descargar el archivo como un buffer
        const fileBuffer = [];
        sftp.createReadStream(remoteFilePath)
          .on('data', (chunk) => {
            fileBuffer.push(chunk);
          })
          .on('end', () => {
            const fileData = Buffer.concat(fileBuffer);
            conn.end();
            resolve(fileData);  // Retorna el archivo como un buffer
          })
          .on('error', (err) => {
            reject('Error leyendo el archivo: ' + err);
          });
      });
    }).connect(sshConfig);
  });
}

// Ruta para descargar el archivo Excel
app.get('/download', async (req, res) => {
  try {
    const fileData = await getFileFromSSH();
    res.setHeader('Content-Disposition', 'attachment; filename=cmeza.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(fileData);
  } catch (err) {
    res.status(500).send('Error al obtener el archivo: ' + err);
  }
});

// Iniciar el servidor Express
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
