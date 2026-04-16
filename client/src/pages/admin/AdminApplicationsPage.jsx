import { useAllApplications, useReviewApplication } from '../../hooks/useApplications';
import { CheckCircle, XCircle, Clock, User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminApplicationsPage() {
  const { data: applications, isLoading, isError, error } = useAllApplications();
  const reviewMutation = useReviewApplication();

  function handleReview(id, status) {
    reviewMutation.mutate(
      { id, status },
      {
        onSuccess: () =>
          toast.success(status === 'approved' ? 'Application approved!' : 'Application rejected'),
        onError: (err) => toast.error(err.message),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          Failed to load applications: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-white md:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Instructor Applications
        </h1>
        <p className="mt-1 text-gray-400">
          Review and manage instructor applications
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard
          label="Pending"
          count={applications.filter((a) => a.status === 'pending').length}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-400/10"
        />
        <StatCard
          label="Approved"
          count={applications.filter((a) => a.status === 'approved').length}
          icon={CheckCircle}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <StatCard
          label="Rejected"
          count={applications.filter((a) => a.status === 'rejected').length}
          icon={XCircle}
          color="text-red-400"
          bg="bg-red-400/10"
        />
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <p className="text-gray-400">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onApprove={() => handleReview(app.id, 'approved')}
              onReject={() => handleReview(app.id, 'rejected')}
              isReviewing={reviewMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, icon: Icon, color, bg }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{count}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ application, onApprove, onReject, isReviewing }) {
  const statusStyles = {
    pending: { badge: 'bg-amber-400/10 text-amber-400 border-amber-400/30', icon: Clock },
    approved: { badge: 'bg-green-400/10 text-green-400 border-green-400/30', icon: CheckCircle },
    rejected: { badge: 'bg-red-400/10 text-red-400 border-red-400/30', icon: XCircle },
  };

  const style = statusStyles[application.status];
  const StatusIcon = style.icon;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Card header — applicant info + status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 font-bold">
            {application.applicant?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-500" />
              <span className="font-semibold text-white">
                {application.applicant?.full_name || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-sm text-gray-400">
                {application.applicant?.email || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(application.created_at), 'MMM d, yyyy')}
          </div>
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}>
            <StatusIcon className="h-3 w-3" />
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Card body — application details */}
      <div className="px-6 py-4 space-y-3">
        <Detail label="Bio" value={application.bio} />
        <Detail label="Expertise" value={application.expertise} />
        <Detail label="Planned Courses" value={application.course_topics} />
      </div>

      {/* Card footer — action buttons (only for pending) */}
      {application.status === 'pending' && (
        <div className="flex gap-3 border-t border-slate-800 px-6 py-4">
          <Button
            variant="primary"
            onClick={onApprove}
            loading={isReviewing}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={onReject}
            loading={isReviewing}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-300 whitespace-pre-line">{value}</p>
    </div>
  );
}
