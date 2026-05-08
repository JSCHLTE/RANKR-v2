"use client";

import { usePlayersData } from "../../../hooks/usePlayersData";

const Players = () => {

  const { players, loading } = usePlayersData();

  return (
      <div>page</div>
  )
}

export default Players