import {
  Arg,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Ctx,
  UseMiddleware,
  Int,
} from 'type-graphql'
import {User} from './entity/User'
import {verify} from 'jsonwebtoken'
import {hash, compare} from 'bcryptjs'
import {MyContext} from './MyContext'
import {createAccessToken, createRefreshToken} from './auth'
import {isAuth} from './isAuthMiddleware'
import {sendRefreshToken} from './sendRefreshToken'
import {getConnection} from 'typeorm'

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string
  @Field(() => User)
  user: User
}
// can create graphql schema inside of it and as i create i am going to tell type-graphql to check graphql type and typescript types
@Resolver()
export class UserResolver {
  // inside Query we can tell what type it returns
  @Query(() => String)
  hello() {
    return 'hi!'
  }
  @Query(() => String)
  // middleware runs before our resolver reads header and set payload
  @UseMiddleware(isAuth)
  bye(@Ctx() {payload}: MyContext) {
    return `your user id is:${payload!.userId}`
  }
  @Query(() => [User])
  users() {
    return User.find()
  }
  @Query(() => User, {nullable: true})
  me(@Ctx() context: MyContext) {
    const authorization = context.req.headers['authorization']
    if (!authorization) {
      throw null
    }
    try {
      const token = authorization.split(' ')[1]
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!)
      return User.findOne(payload.userId)
    } catch (err) {
      console.log(err)
      return null
    }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() {res}: MyContext) {
    sendRefreshToken(res, '')

    return true
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokenForUser(@Arg('userId', () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({id: userId}, 'tokenVersion', 1)

    return true
  }
  // graphql mutations are what we create when we want to update something,modify something
  // 'email' is what user will pass in,email is variable name

  @Mutation(() => LoginResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() {res}: MyContext,
  ): Promise<LoginResponse> {
    console.log(email, password)
    const user = await User.findOne({where: {email}})

    if (!user) {
      throw new Error(`Invalid login.`)
    }

    console.log(password, user.password, user)
    const valid = await compare(password, user.password)

    if (!valid) {
      throw new Error(`Invalid login.`)
    }

    // Login successful
    sendRefreshToken(res, createRefreshToken(user))

    return {
      accessToken: createAccessToken(user),
      user,
    }
  }

  @Mutation(() => Boolean)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string,
  ) {
    const hashedPassword = await hash(password, 12)

    try {
      await User.insert({
        email,
        password: hashedPassword,
      })
    } catch (err) {
      console.log(err)
      return false
    }
    return true
  }
}
