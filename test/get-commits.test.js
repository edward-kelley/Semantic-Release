import test from 'ava';
import {stub} from 'sinon';
import getCommits from '../lib/get-commits';
import {gitRepo, gitCommits, gitDetachedHead} from './helpers/git-utils';

// Save the current working diretory
const cwd = process.cwd();

test.beforeEach(t => {
  // Stub the logger functions
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test.afterEach.always(() => {
  // Restore the current working directory
  process.chdir(cwd);
});

test.serial('Get all commits when there is no last release', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second']);

  // Retrieve the commits with the commits module
  const result = await getCommits(undefined, 'master', t.context.logger);

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.deepEqual(result, commits);
});

test.serial('Get all commits since gitHead (from lastRelease)', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second', 'Third']);

  // Retrieve the commits with the commits module, since commit 'First'
  const result = await getCommits(commits[commits.length - 1].hash, 'master', t.context.logger);

  // Verify the commits created and retrieved by the module are identical
  t.is(result.length, 2);
  t.deepEqual(result, commits.slice(0, 2));
});

test.serial('Get all commits since gitHead (from lastRelease) on a detached head repo', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  const repo = await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second', 'Third']);
  // Create a detached head repo at commit 'feat: Second'
  await gitDetachedHead(repo, commits[1].hash);

  // Retrieve the commits with the commits module, since commit 'First'
  const result = await getCommits(commits[commits.length - 1].hash, 'master', t.context.logger);

  // Verify the module retrieved only the commit 'feat: Second' (included in the detached and after 'fix: First')
  t.is(result.length, 1);
  t.is(result[0].hash, commits[1].hash);
  t.is(result[0].message, commits[1].message);
  t.truthy(result[0].committerDate);
  t.truthy(result[0].author.name);
  t.truthy(result[0].committer.name);
});

test.serial('Return empty array if lastRelease.gitHead is the last commit', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();
  // Add commits to the master branch
  const commits = await gitCommits(['First', 'Second']);

  // Retrieve the commits with the commits module, since commit 'Second' (therefore none)
  const result = await getCommits(commits[0].hash, 'master', t.context.logger);

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});

test.serial('Return empty array if there is no commits', async t => {
  // Create a git repository, set the current working directory at the root of the repo
  await gitRepo();

  // Retrieve the commits with the commits module
  const result = await getCommits(undefined, 'master', t.context.logger);

  // Verify no commit is retrieved
  t.deepEqual(result, []);
});
