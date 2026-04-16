import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyApplication, useSubmitApplication, useDeleteApplication } from '../../hooks/useApplications';
import { validateApplication, hasErrors } from '../../utils/validators';
import { CheckCircle, Clock, XCircle, Send, GraduationCap, Lightbulb, BookOpen, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ApplyInstructorPage() {
  const { data: application, isLoading } = useMyApplication();
  const submitMutation = useSubmitApplication();

  const [form, setForm] = useState({
    bio: '',
    expertise: '',
    course_topics: '',
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateApplication(form);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    submitMutation.mutate(form, {
      onSuccess: () => toast.success('Application submitted!'),
      onError: (err) => toast.error(err.message),
    });
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const deleteMutation = useDeleteApplication();

  function handleRetry() {
    deleteMutation.mutate(application.id, {
      onSuccess: () => toast.success('You can now submit a new application'),
      onError: (err) => toast.error(err.message),
    });
  }

  if (application) {
    return <ApplicationStatus application={application} onRetry={handleRetry} isRetrying={deleteMutation.isPending} />;
  }

  return (
    <div className="mx-auto max-w-4xl py-10 px-6">
      {/* Header with glow effect */}
      <div className="relative mb-10">
        <div className="absolute -top-10 left-1/4 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            Instructor Application
          </div>
          <h1
            className="text-3xl font-bold text-white md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Become an Instructor
          </h1>
          <p className="mt-3 max-w-lg text-gray-400">
            Share your knowledge with thousands of students. Tell us about yourself and what you'd like to teach.
          </p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Left — Form (3/5) */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <Field
              label="About You"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              error={errors.bio}
              placeholder="Tell us about yourself, your background, and your teaching experience..."
              rows={4}
              hint="Minimum 20 characters"
            />

            <Field
              label="Areas of Expertise"
              name="expertise"
              value={form.expertise}
              onChange={handleChange}
              error={errors.expertise}
              placeholder="e.g. Web Development, Data Science, Machine Learning..."
              rows={2}
              hint="What subjects are you most knowledgeable in?"
            />

            <Field
              label="What do you plan to teach?"
              name="course_topics"
              value={form.course_topics}
              onChange={handleChange}
              error={errors.course_topics}
              placeholder="Describe the courses you'd like to create and what students will learn..."
              rows={3}
              hint="Minimum 10 characters"
            />

            <Button type="submit" loading={submitMutation.isPending} className="w-full py-3">
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </Button>
          </form>
        </div>

        {/* Right — Info cards (2/5) */}
        <div className="space-y-4 lg:col-span-2">
          <InfoCard
            icon={GraduationCap}
            title="Share Your Expertise"
            description="Create structured courses with downloadable materials that students can learn from at their own pace."
          />
          <InfoCard
            icon={Lightbulb}
            title="Quick Review Process"
            description="Our admin team reviews applications promptly. You'll be notified once your application is approved."
          />
          <InfoCard
            icon={BookOpen}
            title="Full Course Tools"
            description="Once approved, you'll get access to course creation, material uploads, and student management tools."
          />

          {/* Timeline */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">How it works</h3>
            <div className="space-y-4">
              <Step number="1" text="Fill out the application form" />
              <Step number="2" text="Admin reviews your application" />
              <Step number="3" text="Get approved and start creating" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, placeholder, rows = 3, hint }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-300">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
      />
      {error ? (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

function InfoCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
        <Icon className="h-5 w-5 text-purple-400" />
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
  );
}

function Step({ number, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
        {number}
      </div>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
}

function ApplicationStatus({ application, onRetry, isRetrying }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-400',
      border: 'border-amber-400/30',
      bg: 'bg-amber-400/10',
      glow: 'bg-amber-500/10',
      title: 'Application Under Review',
      message: 'Your application is being reviewed by our admin team. We\'ll update your status soon.',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-400',
      border: 'border-green-400/30',
      bg: 'bg-green-400/10',
      glow: 'bg-green-500/10',
      title: 'Application Approved!',
      message: 'Congratulations! You are now an instructor. Head to your instructor dashboard to start creating courses.',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-400',
      border: 'border-red-400/30',
      bg: 'bg-red-400/10',
      glow: 'bg-red-500/10',
      title: 'Application Not Approved',
      message: 'Unfortunately, your application was not approved at this time. You may contact support for more details.',
    },
  };

  const config = statusConfig[application.status];
  const Icon = config.icon;

  return (
    <div className="mx-auto max-w-3xl py-10 px-6">
      {/* Header */}
      <div className="relative mb-10">
        <div className={`absolute -top-10 left-1/4 h-40 w-40 rounded-full ${config.glow} blur-3xl`} />
        <h1
          className="relative text-3xl font-bold text-white md:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Instructor Application
        </h1>
      </div>

      {/* Status card */}
      <div className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} p-8`}>
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-start gap-5">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${config.bg} ${config.border} border`}>
            <Icon className={`h-7 w-7 ${config.color}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
            <p className="mt-2 text-gray-300 leading-relaxed">{config.message}</p>
            {application.status === 'approved' && (
              <Link to="/instructor/dashboard">
                <Button className="mt-4">
                  Go to Instructor Dashboard
                </Button>
              </Link>
            )}
            {application.status === 'rejected' && (
              <Button className="mt-4" onClick={onRetry} loading={isRetrying}>
                <Send className="mr-2 h-4 w-4" />
                Apply Again
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submission details */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-white">Your Submission</h3>
        <div className="space-y-px overflow-hidden rounded-xl border border-slate-800">
          <Detail label="About You" value={application.bio} />
          <Detail label="Expertise" value={application.expertise} />
          <Detail label="Planned Courses" value={application.course_topics} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1.5 text-gray-300 whitespace-pre-line">{value}</p>
    </div>
  );
}
