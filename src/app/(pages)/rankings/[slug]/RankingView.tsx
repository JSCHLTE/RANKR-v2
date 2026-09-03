"use client";

import { useState } from "react";
import RankingHeader from "./RankingHeader";
import RankingList from "./RankingList";
import { RankingMeta } from "@/types/rank";

interface RankEntry {
  player_id: string;
  rank: number;
}

interface Props {
  meta: RankingMeta;
  ranks: RankEntry[];
}

const RankingView = ({ meta, ranks }: Props) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <RankingHeader
        meta={meta}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
      />

      <RankingList
        author={meta.author}
        ranks={ranks}
        isEditing={isEditing}
      />
    </>
  );
};

export default RankingView;