import React, {useState} from 'react'
import {RouteComponentProps} from 'react-router-dom'
import {setAccessToken} from '../accessToken'
import {MeDocument, MeQuery, useLoginMutation} from 'src/generated/graphql'

export const Login: React.FC<RouteComponentProps> = ({history}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [login] = useLoginMutation()

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        console.log('form submitted')
        const response = await login({
          variables: {
            email,
            password,
          },
          update: (store, {data}): any => {
            if (!data) {
              return null
            }
            store.writeQuery<MeQuery>({
              query: MeDocument,
              data: {
                me: data.login.user,
              },
            })
          },
        })
        console.log(response)

        if (response && response.data) {
          setAccessToken(response.data.login.accessToken)
        }

        window.location.assign('http://localhost:3000')
      }}
    >
      <div>
        <input
          value={email}
          placeholder="email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          value={password}
          placeholder="password"
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">login</button>
    </form>
  )
}
