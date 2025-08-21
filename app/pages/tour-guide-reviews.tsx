import React, { useMemo, useState } from "react";

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

const TourGuideReviews: React.FC = () => {
  const [sortBy, setSortBy] = useState("date");
  const [minRating, setMinRating] = useState(0);

  const reviews: Review[] = [
    {
      id: 1,
      name: "Alice M.",
      rating: 5,
      comment:
        "The location was convenient and check-in was straightforward. The staff on the property were amazing.",
      date: "2025-08-15",
      avatar: "https://i.pinimg.com/736x/f0/4b/c7/f04bc7f4b16a2fc94078139ad03e6f88.jpg",
    },
    {
      id: 2,
      name: "David K.",
      rating: 4,
      comment:
        "Nice job! Felt safe the entire stay. Clean and secure. Kitchen functional for the entire duration.",
      date: "2025-08-12",
      avatar: "https://i.pinimg.com/736x/aa/06/d7/aa06d77cd048b867f5d0b40362e62a76.jpg",
    },
    {
      id: 3,
      name: "Sophie L.",
      rating: 5,
      comment: "Loved the atmosphere and great service. Would definitely book again!",
      date: "2025-08-10",
      avatar: "https://i.pinimg.com/1200x/bb/6a/ef/bb6aef8c1bd48cd8b3b41725eaba18e3.jpg",
    },
    {
      id: 4,
      name: "Michael B.",
      rating: 3.5,
      comment: "The place was okay, but could use some updates. The guide was helpful though.",
      date: "2025-08-08",
      avatar: "https://i.pinimg.com/1200x/57/65/0c/57650c43779b671f0879912f18456ee2.jpg",
    },
    {
      id: 5,
      name: "Sugira Kevine",
      rating: 4.5,
      comment:
        "Great experience overall! The guide was knowledgeable and the location was perfect for our needs.",
      date: "2025-08-05",
      avatar: "https://i.pinimg.com/736x/4a/e1/fc/4ae1fc1554465849a9d897bbc7742024.jpg",
    },

    {
      id: 6,
      name: "Emma W.",
      rating: 2,
      comment: "Not what I expected. The place was not as described and the service was lacking.",
      date: "2025-08-01",
      avatar: "https://i.pinimg.com/736x/a8/ba/96/a8ba9626de3fadff0b38e1c83cdea435.jpg",
    },

  ];

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => r.rating >= minRating)
      .sort((a, b) =>
        sortBy === "rating"
          ? b.rating - a.rating
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [sortBy, minRating, reviews]);

  return (
    <div className="container mx-auto my-5 px-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-semibold">{reviews.length} reviews</h4>

        {/* Sort Options Top-Right */}
        <div>
          <select
            className="border rounded px-2 py-1 shadow-sm mt-20"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most relevant</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="flex flex-col gap-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3">
              {/* Avatar */}
              {review.avatar && (
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}

              {/* Review Content */}
              <div>
                <h6 className="font-semibold mb-0">{review.name}</h6>
                <small className="text-gray-500">
                  {new Date(review.date).toLocaleDateString()} · booked house
                </small>

                {/* Stars */}
                <div className="mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i
                      key={i}
                      className={`bi ${i < review.rating ? "bi-star-fill" : "bi-star"}`}
                      style={{ color: i < review.rating ? "#FFD700" : "#ccc" }}
                    ></i>
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-600 text-sm">{review.comment}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No reviews found.</p>
        )}
      </div>
    </div>
  );
};

export default TourGuideReviews;
