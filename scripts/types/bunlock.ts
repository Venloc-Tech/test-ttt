/* Exported from bun */
/**
 * Types for `bun.lock`
 */
export type BunLockFile = {
  lockfileVersion: 0 | 1;
  workspaces: {
    [workspace: string]: BunLockFileWorkspacePackage;
  };
  overrides?: Record<string, string>;
  patchedDependencies?: Record<string, string>;
  trustedDependencies?: string[];

  /**
   * ```
   * INFO = { prod/dev/optional/peer dependencies, os, cpu, libc (TODO), bin, binDir }
   *
   * // first index is resolution for each type of package
   * npm         -> [ "name@version", registry (TODO: remove if default), INFO, integrity]
   * symlink     -> [ "name@link:path", INFO ]
   * folder      -> [ "name@file:path", INFO ]
   * workspace   -> [ "name@workspace:path" ] // workspace is only path
   * tarball     -> [ "name@tarball", INFO ]
   * root        -> [ "name@root:", { bin, binDir } ]
   * git         -> [ "name@git+repo", INFO, .bun-tag string (TODO: remove this) ]
   * github      -> [ "name@github:user/repo", INFO, .bun-tag string (TODO: remove this) ]
   * ```
   * */
  packages: {
    [pkg: string]: BunLockFilePackageArray;
  };
};

type BunLockFileBasePackageInfo = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalPeers?: string[];
  bin?: string | Record<string, string>;
  binDir?: string;
};

type BunLockFileWorkspacePackage = BunLockFileBasePackageInfo & {
  name?: string;
  version?: string;
};

type BunLockFilePackageInfo = BunLockFileBasePackageInfo & {
  os?: string | string[];
  cpu?: string | string[];
  bundled?: true;
};

/** @see {@link BunLockFile.packages} for more info */
type BunLockFilePackageArray =
/** npm */
  | [
  pkg: string,
  registry: string,
  info: BunLockFilePackageInfo,
  integrity: string,
]
  /** symlink, folder, tarball */
  | [pkg: string, info: BunLockFilePackageInfo]
  /** workspace */
  | [pkg: string]
  /** git, github */
  | [pkg: string, info: BunLockFilePackageInfo, bunTag: string]
  /** root */
  | [pkg: string, info: Pick<BunLockFileBasePackageInfo, "bin" | "binDir">];