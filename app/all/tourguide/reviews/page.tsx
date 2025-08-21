import TourGuideReviews from "@/app/pages/tourguide/reviews";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: 'Tour Guide Reviews',
  description: 'Read reviews from customers about their tour experiences.',
  keywords: ['reviews', 'tour guide', 'customer feedback'],
};

const ReviewsPage = () => {
  return (
    <div>
      <TourGuideReviews />
    </div>
  );
};

export default ReviewsPage;