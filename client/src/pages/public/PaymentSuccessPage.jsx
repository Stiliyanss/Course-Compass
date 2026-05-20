import { Link } from 'react-router-dom';
import { CheckCircle, BookOpen, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

/**
 * PaymentSuccessPage — shown after a successful Stripe payment.
 *
 * When a student pays on Stripe's checkout page, Stripe redirects them
 * back to our app at /payment/success. This page confirms the payment
 * and gives the student links to access their course.
 *
 * The actual enrollment is created by the stripe-webhook Edge Function
 * (server-side), so by the time the student sees this page, they should
 * already be enrolled.
 */
export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        {/* Success icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>

        {/* Heading */}
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Payment Successful!
        </h1>

        {/* Description */}
        <p className="text-gray-400 leading-relaxed">
          You have been enrolled in the course. You can now access all
          course materials including videos, documents, and other resources.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/student/my-courses">
            <Button className="w-full sm:w-auto">
              <BookOpen className="mr-2 h-4 w-4" />
              My Courses
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
