// The API trial: a small number of keys to the 4B router, given out by hand after review. Applicants fill in the
// form on the page (src/site/Apply.tsx); it posts to Web3Forms, which emails each request to the form's inbox with
// the applicant as reply-to, so answering is replying. The inbox is set in the Web3Forms dashboard (form
// "RedBird"), not here.
//
// The dev server never sends (it shows the whole flow): add ?send=1 to the address to send from it for real, or
// ?fail=1 to see the email fallback.

export const trial = {
  enabled: true,
  endpoint: 'https://api.web3forms.com/submit',
  /** Web3Forms access key. It is public by design: it only lets people send email to the form's inbox. */
  accessKey: '636768c4-7e7e-4d7f-832a-18db17dbb84c',
  /**
   * When sending fails (Web3Forms sits behind Cloudflare, which stops requests from mainland China), the form offers
   * to send the request by email to this address instead, answers filled in. Put together here so the address is not
   * one plain string in the page's code; empty drops the fallback.
   */
  fallbackEmail: ['lance', 'infrec.tech'].join('@'),
  /** how soon the team replies, as the page promises it */
  reply: 'as soon as we can',
  /** the version of the trial terms, shown with them and sent with every request */
  termsDate: 'November 4, 2026',
};
