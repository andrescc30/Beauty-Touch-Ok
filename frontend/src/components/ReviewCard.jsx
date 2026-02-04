import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ReviewCard = ({ review }) => {
  return (
    <Card className="p-4 shadow-soft" data-testid={`review-${review.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium" data-testid={`review-user-${review.id}`}>{review.user_nombre}</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString('es-MX')}
        </span>
      </div>
      <p className="text-sm text-muted-foreground" data-testid={`review-comment-${review.id}`}>
        {review.comentario}
      </p>
    </Card>
  );
};
