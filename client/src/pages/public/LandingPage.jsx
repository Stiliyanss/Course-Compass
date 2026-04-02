import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Award, ArrowRight, Sparkles } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import Button from '../../components/ui/Button';
import BecomeInstructor from '../../components/BecomeInstructor';

const features = [
  {
    icon: BookOpen,
    title: 'Diverse Courses',
    description: 'Browse a wide selection of courses across various topics and skill levels.',
  },
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Learn from experienced professionals who are passionate about teaching.',
  },
  {
    icon: Award,
    title: 'Track Your Progress',
    description: 'Monitor your learning journey and complete courses at your own pace.',
  },
];

export default function LandingPage() {
  const { user, profile } = useAuth();
  const isStudent = user && profile?.role === ROLES.STUDENT;

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <Sparkles className="h-4 w-4" />
            Start your learning journey today
          </div>

          <h1
            className="text-6xl font-black tracking-tight text-white md:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Find the perfect course
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-amber-400 bg-clip-text text-transparent">
              for your goals
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Explore courses created by expert instructors. Learn new skills,
            advance your career, and achieve your goals with Course Compass.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/courses">
              <Button className="px-8 py-3 text-base">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link to="/register">
                <Button variant="outline" className="px-8 py-3 text-base">
                  Create Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-800 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2
            className="text-center text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Why Course Compass?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            Everything you need to learn effectively in one place.
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center transition-all hover:border-purple-500/40 hover:bg-slate-900"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                  <feature.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become an Instructor — only visible to logged-in students */}
      {isStudent && <BecomeInstructor />}

      {/* CTA Section */}
      {!user && (
        <section className="relative overflow-hidden border-t border-slate-800 py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20" />
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <h2
              className="text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to start learning?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-gray-400">
              Join Course Compass today and get access to courses from top instructors.
            </p>
            <Link to="/register" className="mt-8 inline-block">
              <Button className="px-8 py-3 text-base">
                Sign Up for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
