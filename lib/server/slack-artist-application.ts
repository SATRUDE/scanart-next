import type { ArtistApplication } from '@/lib/artist-application';
import { OFFERING_LABEL } from '@/lib/artist-application';

/**
 * The "new artist application" Slack message, through the SLACK_WEBHOOK_URL
 * already used for orders and feedback. No new credential.
 *
 * Slack matters here more than it does for feedback: an application is a person
 * waiting for an answer, and the Talent page is somewhere Mark visits rather
 * than somewhere that notifies him.
 */
export function buildSlackApplicationMessage(a: ArtistApplication): Record<string, unknown> {
  const links = [a.website, a.instagram].filter(Boolean).join(' · ');
  return {
    text: `New artist application: ${a.name}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: '*A new artist application*' } },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*${a.name}*, ${a.basedIn}`,
            `Asking for: ${OFFERING_LABEL[a.offering]}`,
            a.keepOnFile ? 'Happy to be kept on file' : null,
            '',
            a.styleNote,
            '',
            `*Why they think it fits*\n${a.whyFit}`,
          ]
            .filter(v => v !== null)
            .join('\n'),
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: [a.email, links].filter(Boolean).join(' · ') }],
      },
    ],
  };
}

export async function sendSlackApplication(a: ArtistApplication): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSlackApplicationMessage(a)),
  });
}
