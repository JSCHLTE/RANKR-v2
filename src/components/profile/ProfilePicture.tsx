"use client";

import { useState } from "react";

interface ProfilePictureProps {
  src: string | undefined;
  className: string;
  alt?: string;
  onClick?: () => void;
}

const ProfilePicture = ({
  src,
  className,
  alt = "Profile picture",
  onClick,
}: ProfilePictureProps) => {

  return (
    <img
      src={src ? src : "../lion-default-pfp.svg"}
      alt={alt}
      className={`${className} rounded-full object-cover shrink-0`}
      draggable="false"
      onClick={onClick}
    />
  );
};

export default ProfilePicture;