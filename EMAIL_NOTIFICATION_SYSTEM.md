# Email Notification System Implementation

## Overview

This document describes the complete email notification system implemented for the Muse AI Generated Art Marketplace. The system sends automated email notifications to users for important events like sales, bids, and auction activities.

## Architecture

### Core Components

1. **Email Service** (`src/services/emailService.ts`)
   - Central service for handling all email operations
   - Supports multiple providers (SMTP, SendGrid)
   - Template-based email generation
   - Integration with job queue for async processing

2. **Bid Service** (`src/services/bidService.ts`)
   - Handles bid-related operations and notifications
   - Manages auction bids and direct bids
   - Triggers email notifications for bid events

3. **Transaction Service Integration** (`src/services/transactionService.ts`)
   - Enhanced to send email notifications for completed transactions
   - Notifies sellers on successful sales
   - Notifies buyers on successful purchases

4. **Job Queue Integration**
   - Uses existing Bull queue system
   - `EMAIL_NOTIFICATION` job type for async processing
   - Retry mechanism with exponential backoff

## Email Providers

### SMTP Provider
- Uses Nodemailer for email delivery
- Configurable SMTP settings
- Fallback to logging if provider not available

### SendGrid Provider
- Uses SendGrid API for email delivery
- Requires API key configuration
- Fallback to logging if provider not available

## Email Templates

### Sale Notifications
- **Seller**: Notifies when artwork is sold
- **Buyer**: Notifies when purchase is completed

### Bid Notifications
- **New Bid**: Notifies artwork owner of new bids
- **Bid Accepted**: Notifies bidder when bid is accepted
- **Outbid**: Notifies previous bidder when outbid
- **Auction Ending**: Warns when auction is about to end

## Configuration

### Environment Variables

```bash
# Email provider: smtp | sendgrid
EMAIL_PROVIDER=smtp

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@muse.art

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM=noreply@muse.art
```

## API Endpoints

### Bid Management
- `POST /api/bids` - Create new bid
- `GET /api/bids/my-bids` - Get user's bids
- `GET /api/bids/artwork/:artworkId` - Get bids for artwork
- `PUT /api/bids/:id/status` - Update bid status
- `POST /api/bids/expire` - Expire old bids (admin)
- `POST /api/bids/check-auctions` - Check ending auctions (admin)

## User Preferences

Users can control email notifications through their preferences:
- `user.preferences.notifications.email` - Enable/disable email notifications
- Respects user privacy settings

## Email Content

### Design Principles
- Modern, responsive HTML templates
- Clear call-to-action buttons
- Brand-consistent styling
- Mobile-friendly layout
- Alt text for accessibility

### Template Features
- Dynamic content based on event type
- Personalized with user information
- Links to relevant artwork pages
- Professional branding and styling

## Error Handling

### Retry Mechanism
- 3 retry attempts with exponential backoff
- Failed jobs are logged for debugging
- Graceful degradation to logging

### Fallback Behavior
- If email provider fails, system continues operation
- Errors are logged but don't break user experience
- Mock email sending in development

## Testing

### Unit Tests
- Email template generation
- User preference validation
- Job queue integration
- Provider fallback behavior

### Test Coverage
- Template rendering for all email types
- User preference scenarios
- Error conditions
- Integration with job queue

## Security Considerations

### Data Protection
- User email addresses are validated
- No sensitive data in email subjects
- Rate limiting on email sending

### Privacy
- Respects user notification preferences
- No email sent to users who opted out
- Secure handling of user data

## Performance

### Async Processing
- All emails sent via job queue
- Non-blocking for main application flow
- Configurable concurrency limits

### Caching
- Email templates are generated efficiently
- User data cached for preference checks
- Optimized database queries

## Monitoring

### Logging
- All email operations logged
- Success/failure tracking
- Performance metrics

### Health Checks
- Email service health monitoring
- Provider connectivity checks
- Queue status monitoring

## Deployment

### Environment Setup
1. Configure email provider settings
2. Set up SMTP or SendGrid credentials
3. Test email delivery
4. Monitor job queue performance

### Production Considerations
- Use production email credentials
- Monitor deliverability rates
- Set up bounce handling
- Configure rate limits

## Future Enhancements

### Planned Features
- Email digest options
- Customizable notification frequency
- Advanced email analytics
- Template customization for users
- Push notification integration

### Scalability
- Multiple email provider support
- Load balancing for high volume
- Geographic email routing
- Advanced deliverability features

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check provider configuration
2. **Jobs stuck**: Verify Redis connection
3. **Templates not rendering**: Check data structure
4. **User preferences not working**: Verify database schema

### Debug Tools
- Job queue monitoring
- Email provider logs
- Application logs
- Database query analysis

## Integration Points

### Existing Systems
- **Notification System**: Creates notification records
- **User Management**: Respects user preferences
- **Transaction System**: Triggers on completed sales
- **Bid System**: Triggers on bid events
- **WebSocket Service**: Real-time updates complement

### Third-party Services
- **SMTP Providers**: Gmail, Outlook, custom
- **Email Services**: SendGrid, Mailgun, etc.
- **Analytics**: Email open tracking, click tracking

## Conclusion

The email notification system provides a robust, scalable solution for keeping users informed about important marketplace activities. It integrates seamlessly with existing infrastructure while maintaining high standards for deliverability and user experience.

The system is designed to be:
- **Reliable**: With retry mechanisms and fallbacks
- **Scalable**: Using job queues and async processing
- **User-friendly**: With beautiful, responsive templates
- **Maintainable**: With clear separation of concerns
- **Secure**: Respecting user privacy and preferences
