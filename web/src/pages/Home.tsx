import React from 'react';
import { useUsersQuery } from 'src/generated/graphql';

interface Props {}

export const Home: React.FC<Props> = () => {
  const { data } = useUsersQuery({ fetchPolicy: 'network-only' });

  if (!data) {
    return <div>Loading...</div>;
  }
  // mapping thru array in react make sure to pass in a key
  return (
    <div>
      <div>users:</div>
      <ul>
        {data.users.map((x) => {
          return (
            <li key={x.id}>
              {x.email},{x.id}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
