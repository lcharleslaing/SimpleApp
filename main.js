const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const express = require('express')

// Enable hot reload for development (simplified configuration)
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname)
}

// Store the icon path globally to maintain reference
const iconPath = path.join(__dirname, 'assets/icon.png')

// Set application name for proper icon association in Windows
app.name = 'SimpleApp'

const SERVER_PORT = 3000
let serverStarted = false

const startServer = () => {
  return new Promise((resolve, reject) => {
    const serverApp = express()
    // Serve static files (including index.html, views, styles, etc.)
    serverApp.use(express.static(__dirname))
    // Serve partials from /partials
    serverApp.use('/partials', express.static(path.join(__dirname, 'partials')))
    serverApp.listen(SERVER_PORT, () => {
      console.log(`Express server running at http://localhost:${SERVER_PORT}`)
      resolve()
    }).on('error', (err) => {
      console.error('Failed to start Express server:', err)
      reject(err)
    })
  })
}

const createWindow = () => {
  // Get the primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // Calculate 3/4 of the dimensions
  const windowWidth = Math.floor(width * 0.75)
  const windowHeight = Math.floor(height * 0.75)

  const win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    center: true, // Center the window on screen
    icon: iconPath, // Set application icon
    title: 'SimpleApp', // Explicit title setting
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until ready
  })

  // Force the icon to be used in taskbar (windows specific)
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.execPath)
  }

  // Once content has loaded, show the window to avoid flash of white
  win.once('ready-to-show', () => {
    win.show()
  })

  win.loadURL(`http://localhost:${SERVER_PORT}/index.html`)

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools()
  }
}

app.commandLine.appendSwitch('ignore-certificate-errors');
console.log('Ignoring certificate errors for development');

app.whenReady().then(async () => {
  if (!serverStarted) {
    await startServer()
    serverStarted = true
  }
  createWindow()
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})