export class FeedbackValidationError extends Error {
  readonly code = 'feedback_validation_error';

  constructor(message = 'Feedback payload is invalid') {
    super(message);
    this.name = 'FeedbackValidationError';
  }
}

export class FeedbackQuotaExceededError extends Error {
  readonly code = 'feedback_quota_exceeded';

  constructor(message = 'Feedback quota exceeded') {
    super(message);
    this.name = 'FeedbackQuotaExceededError';
  }
}

export class FeedbackConfigurationError extends Error {
  readonly code = 'feedback_configuration_error';

  constructor(message = 'Feedback is not configured') {
    super(message);
    this.name = 'FeedbackConfigurationError';
  }
}

export class FeedbackDeliveryError extends Error {
  readonly code = 'feedback_delivery_error';

  constructor(message = 'Feedback could not be delivered') {
    super(message);
    this.name = 'FeedbackDeliveryError';
  }
}
