import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import { v2 as cloudinary } from 'cloudinary'
import { removeBackground } from '@imgly/background-removal-node'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '10mb' }))

const requiredEnv = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MONGODB_URI',
  'MONGODB_DB_NAME',
]

const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  console.error('Missing required environment variables:', missingEnv.join(', '))
  process.exit(1)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const mongoClient = new MongoClient(process.env.MONGODB_URI)
let usersCollection

async function connectDb() {
  try {
    await mongoClient.connect()
    const db = mongoClient.db(process.env.MONGODB_DB_NAME)
    usersCollection = db.collection('users')
    console.log('Connected to MongoDB successfully')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    console.error('Check backend/.env and make sure MONGODB_URI is a real MongoDB connection string.')
    // Do not exit the process here - allow the server to start so we can
    // test background removal endpoints even if the database is unreachable.
    usersCollection = null
  }
}

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'Background removal API is running' })
})

app.post('/remove-background', async (req, res) => {
  try {
    const { imageBase64, email } = req.body
    if (!imageBase64 || !email) {
      return res.status(400).send({ error: 'Missing image or email.' })
    }

    const isDataUri = typeof imageBase64 === 'string' && imageBase64.startsWith('data:')
    let imageSource

    if (isDataUri) {
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
      if (!matches) {
        return res.status(400).send({ error: 'Invalid image data URI.' })
      }

      const [, mimeType, base64Data] = matches
      const imageBuffer = Buffer.from(base64Data, 'base64')
      imageSource = new Blob([imageBuffer], { type: mimeType })
    } else if (typeof imageBase64 === 'string') {
      imageSource = imageBase64
    } else {
      return res.status(400).send({ error: 'Unsupported image format.' })
    }

    const resultBlob = await removeBackground(imageSource)
    const arrayBuffer = await resultBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResponse = await cloudinary.uploader.upload_stream(
      { folder: 'background-removals', resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          return res.status(500).send({ error: error.message })
        }
        res.send({ url: result.secure_url })
      }
    )

    uploadResponse.end(buffer)
  } catch (error) {
    console.error('Background removal error:', error)
    res.status(500).send({ error: error.message || 'Background removal failed.' })
  }
})

app.listen(port, () => {
  connectDb().then(() => {
    console.log(`Server listening on http://localhost:${port}`)
  })
})
