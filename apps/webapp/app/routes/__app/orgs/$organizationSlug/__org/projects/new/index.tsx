import { FolderIcon } from "@heroicons/react/20/solid";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import { Await, Form, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { defer } from "@remix-run/server-runtime";
import classNames from "classnames";
import { Suspense } from "react";
import invariant from "tiny-invariant";
import { OctoKitty } from "~/components/GitHubLoginButton";
import { Panel } from "~/components/layout/Panel";
import { StepNumber } from "~/components/onboarding/StepNumber";
import {
  PrimaryButton,
  PrimaryLink,
  SecondaryLink,
} from "~/components/primitives/Buttons";
import { InputGroup } from "~/components/primitives/InputGroup";
import { Label } from "~/components/primitives/Label";
import { Spinner } from "~/components/primitives/Spinner";
import { Body } from "~/components/primitives/text/Body";
import { SubTitle } from "~/components/primitives/text/SubTitle";
import { NewProjectPresenter } from "~/presenters/newProjectPresenter.server";
import { requireUserId } from "~/services/session.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const userId = await requireUserId(request);
  invariant(params.organizationSlug, "Organization slug is required");

  const presenter = new NewProjectPresenter();

  return defer(await presenter.data(userId, params.organizationSlug));
};

export default function Page() {
  const { appAuthorizations, redirectTo, repositories } =
    useLoaderData<typeof loader>();

  return (
    <div className="grid w-full grid-cols-3 gap-8">
      <Form method="post" className="col-span-2 max-w-4xl">
        {appAuthorizations.length === 0 ? (
          <>
            <ConnectToGithub redirectTo={redirectTo} />
            <ConfigureGithub />
          </>
        ) : (
          <>
            <Panel className="!p-4">
              <div className="mb-3 grid grid-cols-2 gap-4">
                <InputGroup>
                  <Label htmlFor="appAuthorizationId">
                    Select a GitHub repo
                  </Label>

                  <Suspense fallback={<Spinner />}>
                    <Await
                      errorElement={<p>Error loading repositories</p>}
                      resolve={repositories}
                    >
                      {(repos) => (
                        <ul>
                          {repos.map((repo) => (
                            <li
                              key={repo.repository.id}
                              className={classNames(
                                "flex items-center justify-between gap-2",
                                repo.status === "relevant"
                                  ? "bg-blue-500 text-white"
                                  : "text-slate-400"
                              )}
                            >
                              <a
                                href={repo.repository.html_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {repo.repository.full_name}#
                                {repo.repository.default_branch}
                              </a>
                              <span>
                                {repo.repository.private ? (
                                  <LockClosedIcon className="h-4 w-4 text-white" />
                                ) : (
                                  <LockOpenIcon className="h-4 w-4 text-white" />
                                )}
                              </span>
                              <span>
                                <PrimaryButton size="regular">
                                  Deploy
                                </PrimaryButton>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Await>
                  </Suspense>
                </InputGroup>
              </div>
            </Panel>
            <Panel className="mt-4">
              <div className="mb-3 grid grid-cols-2 gap-4">
                {appAuthorizations.map((app) => (
                  <SecondaryLink
                    to={`/apps/github?redirectTo=${encodeURIComponent(
                      redirectTo
                    )}&authorizationId=${app.id}`}
                    reloadDocument
                    key={app.id}
                  >
                    Configure {app.accountName}
                  </SecondaryLink>
                ))}

                <PrimaryLink
                  size="large"
                  to={`/apps/github?redirectTo=${encodeURIComponent(
                    redirectTo
                  )}`}
                >
                  <OctoKitty className="mr-1 h-5 w-5" />
                  Add another account
                </PrimaryLink>
              </div>
            </Panel>
          </>
        )}
      </Form>
    </div>
  );
}

function ConnectToGithub({ redirectTo }: { redirectTo: string }) {
  return (
    <>
      <SubTitle className="flex items-center">
        <StepNumber active stepNumber="1" />
        Grant GitHub repo access to get started
      </SubTitle>
      <Panel className="mb-6 flex h-56 flex-col items-center justify-center gap-4">
        <PrimaryLink
          size="large"
          to={`/apps/github?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          <OctoKitty className="mr-1 h-5 w-5" />
          Grant access
        </PrimaryLink>
        <Body size="extra-small" className="flex items-center text-slate-400">
          To deploy a new project you need to authorize our GitHub app.{" "}
          <a
            href="https://docs.trigger.dev/faq#why-do-we-ask-for-github-access"
            target="_blank"
            rel="noreferrer"
            className="ml-1 underline decoration-slate-500 underline-offset-2 transition hover:cursor-pointer hover:text-slate-300"
          >
            Learn more.
          </a>
        </Body>
      </Panel>
    </>
  );
}

function ConfigureGithub() {
  return (
    <>
      <div className="mt-6">
        <SubTitle className="flex items-center">
          <StepNumber stepNumber="2" />
          Create your GitHub repository from a template
        </SubTitle>
        <Panel className="flex h-56 w-full max-w-4xl items-center justify-center gap-6">
          <OctoKitty className="h-10 w-10 text-slate-600" />
          <div className="h-[1px] w-16 border border-dashed border-slate-600"></div>
          <FolderIcon className="h-10 w-10 text-slate-600" />
        </Panel>
      </div>
    </>
  );
}