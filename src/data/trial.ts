// The API trial: a small number of keys to the 4B router, given out by hand after review. Applicants fill in the
// form on the page (src/site/Apply.tsx); it posts to a form service the team owns, which emails each request to the
// reviewers with the applicant as reply-to, so approving is replying with a key.
//
// Until `endpoint` is set the form cannot send: the dev server pretends to (for previews), a build says it is not
// connected. Keep `enabled` false on the live page until the endpoint works.

export const trial = {
  enabled: true,
  /** where the form posts: a Web3Forms or Formspree endpoint (JSON in, JSON out) */
  endpoint: '',
  /** Web3Forms reads its public access key from the body; Formspree needs none */
  accessKey: '',
  /** shown when sending fails, so a request can still reach the team */
  fallbackEmail: '',
  /** how soon the team replies, as the page promises it */
  reply: 'within a few working days',
};
