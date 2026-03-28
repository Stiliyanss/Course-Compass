export function validateLogin(values) {
  const errors = {};
  if (!values.email || !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Invalid email address';
  }
  if (!values.password || values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
}

export function validateRegister(values) {
  const errors = {};
  if (!values.full_name || values.full_name.length < 2) {
    errors.full_name = 'Name must be at least 2 characters';
  }
  if (!values.email || !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Invalid email address';
  }
  if (!values.password || values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
}

export function validateForgotPassword(values) {
  const errors = {};
  if (!values.email || !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Invalid email address';
  }
  return errors;
}

export function validateCourse(values) {
  const errors = {};
  if (!values.title || values.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }
  if (!values.description || values.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  if (values.price == null || Number(values.price) < 0) {
    errors.price = 'Price must be 0 or greater';
  }
  if (!values.duration) {
    errors.duration = 'Duration is required';
  }
  return errors;
}

export function validateApplication(values) {
  const errors = {};
  if (!values.bio || values.bio.length < 20) {
    errors.bio = 'Bio must be at least 20 characters';
  }
  if (!values.expertise || values.expertise.length < 5) {
    errors.expertise = 'Expertise is required';
  }
  if (!values.course_topics || values.course_topics.length < 10) {
    errors.course_topics = 'Please describe what you plan to teach';
  }
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
