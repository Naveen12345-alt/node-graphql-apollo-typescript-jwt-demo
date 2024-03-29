import 'dotenv/config'
import 'reflect-metadata'
import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import {UserResolver} from './UserResolver'
import {createConnection} from 'typeorm'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import {verify} from 'jsonwebtoken'
import {User} from './entity/User'
import {createAccessToken, createRefreshToken} from './auth'
import {sendRefreshToken} from './sendRefreshToken'
;(async () => {
  const app = express()
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    }),
  )

  app.use(cookieParser())

  app.post('/refresh_token', async (req, res) => {
    console.log(req.cookies)
    const token = req.cookies.jid

    if (!token) {
      return res.send({ok: false, accessToken: ''})
    }

    let payload: any = null
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!)
    } catch (e) {
      console.log(e)
      return res.send({ok: false, accessToken: ''})
    }

    const user = await User.findOne({id: payload.userId})

    console.log('USER:', user)
    if (!user) {
      return res.send({ok: false, accessToken: ''})
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ok: false, accessToken: ''})
    }

    sendRefreshToken(res, createRefreshToken(user))

    return res.send({ok: true, accessToken: createAccessToken(user)})
  })

  await createConnection()

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({req, res}) => ({
      req,
      res,
    }),
  })

  apolloServer.applyMiddleware({app, cors: false})

  app.listen(4000, () => {
    console.log('Express server started on port 4000')
  })
})()
