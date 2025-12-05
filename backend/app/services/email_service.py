"""
Email service using SMTP.
"""
from email.message import EmailMessage
from email.utils import formataddr
import smtplib
import ssl

from app.config import settings


class EmailService:
    """Simple SMTP email sender."""

    def __init__(self) -> None:
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.username = settings.smtp_username
        self.password = settings.smtp_password
        self.from_email = settings.smtp_from_email
        self.from_name = settings.smtp_from_name
        self.use_tls = settings.smtp_use_tls
        self.use_ssl = settings.smtp_use_ssl

    def _ensure_configured(self) -> None:
        """Validate SMTP configuration before sending."""
        if not self.host or not self.from_email:
            raise RuntimeError("Email service is not configured")

    def send_email(
        self,
        recipient: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> None:
        """
        Send an email via SMTP.

        Raises:
            RuntimeError: If configuration is missing.
        """
        self._ensure_configured()

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = formataddr((self.from_name, self.from_email))
        message["To"] = recipient

        fallback_text = text_body or "This message requires an email client that supports HTML."
        message.set_content(fallback_text)
        message.add_alternative(html_body, subtype="html")

        SMTP_TIMEOUT = 30  # seconds

        if self.use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(self.host, self.port, context=context, timeout=SMTP_TIMEOUT) as server:
                if self.username:
                    server.login(self.username, self.password)
                server.send_message(message)
            return

        with smtplib.SMTP(self.host, self.port, timeout=SMTP_TIMEOUT) as server:
            if self.use_tls:
                server.starttls(context=ssl.create_default_context())
            if self.username:
                server.login(self.username, self.password)
            server.send_message(message)

