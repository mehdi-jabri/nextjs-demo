// CANONICAL pattern for extending <<org>>-common-error-handling.
// You do NOT register a @RestControllerAdvice in this service. The lib does.
// You add new error cases by extending the lib's exception base.

package <<org>>.<<service_name>>.domain.exception;

import <<org>>.commons.errorhandling.DomainException;
import <<org>>.commons.errorhandling.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.UUID;

// Approach 1: subclass DomainException with @ResponseStatus.
// The lib's advice maps it to a ProblemDetail with the chosen status, type URI, title, and detail.
@ResponseStatus(HttpStatus.NOT_FOUND)
public class OrderNotFoundException extends DomainException {

    public OrderNotFoundException(UUID orderId) {
        super(
            ErrorCode.RESOURCE_NOT_FOUND,
            "Order %s not found".formatted(orderId),
            // properties surfaced under ProblemDetail.properties:
            java.util.Map.of("orderId", orderId.toString())
        );
    }
}

// Approach 2: a 409 conflict
@ResponseStatus(HttpStatus.CONFLICT)
class OrderConflictException extends DomainException {
    public OrderConflictException(UUID orderId, String reason) {
        super(
            ErrorCode.RESOURCE_CONFLICT,
            "Order %s conflict: %s".formatted(orderId, reason),
            java.util.Map.of("orderId", orderId.toString(), "reason", reason)
        );
    }
}

/*
Approach 3 — non-trivial mapping where @ResponseStatus is not enough.
Register an ExceptionMapper bean (per the lib's contract):

@Component
class PricingUnavailableMapper implements <<org>>.commons.errorhandling.ExceptionMapper<PricingUnavailableException> {

    @Override
    public Class<PricingUnavailableException> handles() { return PricingUnavailableException.class; }

    @Override
    public ProblemDetail toProblemDetail(PricingUnavailableException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        pd.setType(URI.create("https://errors.<<org>>.com/pricing-unavailable"));
        pd.setProperty("retryAfter", ex.retryAfter().toSeconds());
        return pd;
    }
}

The lib's advice picks up the bean via dependency injection and routes the exception to it.
*/

// =====================================================================
// BANNED — every one of these is a bug:
// =====================================================================
/*
- @RestControllerAdvice in this service (the lib already provides one — duplicate would conflict).
- A custom error envelope DTO (use ProblemDetail).
- Catching DomainException in the controller (let the lib's advice handle it).
- @ExceptionHandler methods inside the controller class (use the DomainException subclass + @ResponseStatus).
- Logging the exception then re-throwing (the lib already logs; double-logging adds noise).
*/
