const { readFile, writeFile } = require("fs/promises");

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const pkgLock = JSON.parse(await readFile("package-lock.json", "utf8"));

const lockVersions = Object.entries(pkgLock.dependencies).reduce(
  (acc, [name, { version }]) => acc.set(name, version),
  new Map()
);

if (pkg.dependencies) {
  pkg.dependencies = Object.keys(pkg.dependencies).reduce(
    (acc, name) => ({ ...acc, [name]: lockVersions.get(name) }),
    {}
  );
}

if (pkg.devDependencies) {
  pkg.devDependencies = Object.keys(pkg.devDependencies).reduce(
    (acc, name) => ({ ...acc, [name]: lockVersions.get(name) }),
    {}
  );
}

await writeFile("package.json", JSON.stringify(pkg, null, 2));
