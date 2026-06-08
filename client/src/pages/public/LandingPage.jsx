import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Award, ArrowRight, Sparkles, PlusCircle, BarChart3, Layers, TrendingUp } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
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

// Reusable scroll-triggered fade-up wrapper
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated word-by-word text reveal
function WordReveal({ text, className = '', delay = 0, gradient = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const words = text.split(' ');

  return (
    <span ref={ref} className={gradient ? '' : className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.4, delay: delay + i * 0.06, ease: 'easeOut' }}
          className={`inline-block mr-[0.25em] ${gradient ? `${className} px-[0.1em]` : ''}`}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Shiny text with a moving highlight
function ShinyText({ children }) {
  return (
    <span className="relative inline-block overflow-hidden">
      {children}
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
      />
    </span>
  );
}

export default function LandingPage() {
  const { user, profile } = useAuth();
  const isStudent = user && profile?.role === ROLES.STUDENT;
  const isInstructor = user && profile?.role === ROLES.INSTRUCTOR;

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 md:py-32">
        {/* Animated background glow orbs */}
        <motion.div
          className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300"
          >
            <Sparkles className="h-4 w-4" />
            <ShinyText>Start your learning journey today</ShinyText>
          </motion.div>

          {/* Heading — word by word reveal */}
          <h1
            className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <WordReveal text="Find the perfect course" delay={0.2} className="text-white" />
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-purple-400 via-blue-400 to-amber-400 bg-clip-text text-transparent"
            >
              for your goals
            </motion.span>
          </h1>

          {/* Subtitle — word blur reveal */}
          <div className="mx-auto mt-6 max-w-2xl">
            <WordReveal
              text="Explore courses created by expert instructors. Learn new skills, advance your career, and achieve your goals with Course Compass."
              className="text-lg text-gray-400"
              delay={1.2}
            />
          </div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          >
            <Link to="/courses">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button className="px-8 py-3 text-base">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
            {!user && (
              <Link to="/register">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" className="px-8 py-3 text-base">
                    Create Account
                  </Button>
                </motion.div>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-800 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FadeUp>
            <h2
              className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Why Course Compass?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
              Everything you need to learn effectively in one place.
            </p>
          </FadeUp>

          <div className="mt-10 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <FadeUp key={feature.title} delay={0.15 * i}>
                <motion.div
                  whileHover={{ y: -6, borderColor: 'rgba(168,85,247,0.4)' }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center sm:p-8 transition-colors hover:bg-slate-900"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 transition-colors group-hover:bg-purple-500/20"
                  >
                    <feature.icon className="h-6 w-6 text-purple-400" />
                  </motion.div>
                  <h3 className="mt-6 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Become an Instructor — only visible to logged-in students */}
      {isStudent && <BecomeInstructor />}

      {/* Instructor section — only visible to logged-in instructors */}
      {isInstructor && <InstructorSection />}

      {/* CTA Section */}
      {!user && (
        <section className="relative overflow-hidden border-t border-slate-800 py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20" />
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <FadeUp>
              <h2
                className="text-2xl font-bold text-white sm:text-3xl md:text-4xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Ready to start learning?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-gray-400">
                Join Course Compass today and get access to courses from top instructors.
              </p>
              <Link to="/register" className="mt-8 inline-block">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="px-8 py-3 text-base">
                    Sign Up for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </FadeUp>
          </div>
        </section>
      )}
    </>
  );
}

function InstructorSection() {
  return (
    <section className="relative overflow-hidden border-t border-slate-800 py-12 sm:py-20">
      {/* Animated background glow */}
      <motion.div
        className="absolute top-0 left-1/3 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-amber-500/8 blur-3xl"
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
          {/* Left — text content */}
          <FadeUp className="flex-1 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
              <BarChart3 className="h-3 w-3" />
              Instructor Hub
            </div>
            <h2
              className="text-2xl font-bold text-white sm:text-3xl md:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Share your knowledge
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                with the world
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-gray-400 lg:mx-0">
              Create engaging courses, organize content into sections, upload materials, and track how your students are progressing — all from one dashboard.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/instructor/courses/new">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="px-6 py-3 text-base">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Course
                  </Button>
                </motion.div>
              </Link>
              <Link to="/instructor/dashboard">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" className="px-6 py-3 text-base">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </FadeUp>

          {/* Right — feature cards */}
          <div className="w-full max-w-md space-y-4 lg:flex-1">
            {[
              {
                icon: Layers,
                title: 'Organize with Sections',
                desc: 'Structure your course into clear sections with drag-and-drop reordering.',
                color: 'purple',
              },
              {
                icon: BookOpen,
                title: 'Upload Materials',
                desc: 'Add PDFs, videos, and documents that students can access anytime.',
                color: 'blue',
              },
              {
                icon: TrendingUp,
                title: 'Track Performance',
                desc: 'See enrollment numbers, revenue, and student progress in real time.',
                color: 'amber',
              },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={0.15 * i}>
                <motion.div
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="group flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-all hover:border-purple-500/30 hover:bg-slate-900"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border ${
                    item.color === 'purple'
                      ? 'bg-purple-500/10 border-purple-500/20'
                      : item.color === 'blue'
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
                  }`}>
                    <item.icon className={`h-5 w-5 ${
                      item.color === 'purple'
                        ? 'text-purple-400'
                        : item.color === 'blue'
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
