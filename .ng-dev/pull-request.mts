import { PullRequestConfig } from '@angular/dev-infra-private/ng-dev';

/**
 * Configuration for the merge tool in `ng-dev`. This sets up the labels which
 * are respected by the merge script (e.g. the target labels).
 */
export const pullRequest: PullRequestConfig = {
  githubApiMerge: {
    default: 'rebase',
    labels: [{ pattern: 'squash commits', method: 'squash' }],
  },
  mergeReadyLabel: /^action: merge(-assistance)?/,
  caretakerNoteLabel: /(action: merge-assistance)/,
  commitMessageFixupLabel: 'commit message fixup',
};
