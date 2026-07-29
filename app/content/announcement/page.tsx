"use client";

import { PostsManager } from "@/components/posts-manager";

export default function AnnouncementPage() {
  return (
    <PostsManager
      group="announcement"
      pageTitle="Announcement"
      pageDescription="System notices and updates shown to customers in the mobile app."
    />
  );
}
