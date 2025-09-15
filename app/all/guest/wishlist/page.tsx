
import React from "react";
import WishlistPage from "../../../pages/guest/wishlist";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: 'My Wishlist',
    description: 'Wishlist Items Properties.',
    keywords: ['listing', 'guest', 'property wishlist'],
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
