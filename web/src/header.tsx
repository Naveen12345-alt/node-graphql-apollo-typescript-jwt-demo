import React from 'react'
import {Link} from 'react-router-dom'
import {setAccessToken} from './accessToken'
import {useLogoutMutation, useMeQuery} from './generated/graphql'

interface Props {}

export const Header: React.FC<Props> = () => {
  const {data, loading} = useMeQuery()
  const [logout, {client}] = useLogoutMutation()

  let body: any = null

  if (loading) {
    body = null
  } else if (data?.me) {
    body = <div>you are now logged in as: {data.me.email}</div>
  } else {
    body = <div>not logged in</div>
  }

  return (
    <header>
      <div>
        <Link to="/">home</Link>
      </div>
      <div>
        <Link to="/register">Register</Link>
      </div>
      <div>
        <Link to="/login">login</Link>
      </div>
      <div>
        <Link to="/bye">loggedInorNot</Link>
      </div>
      {!loading && data && data.me ? (
        <button
          onClick={async () => {
            await logout()
            setAccessToken('')
            client?.clearStore()
            window.location.assign('http://localhost:3000')
          }}
        >
          logout
        </button>
      ) : null}
      {body}
    </header>
  )
}
