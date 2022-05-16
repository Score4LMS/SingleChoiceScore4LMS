 H5P Single Choice Set with Score Editor
=====================

Allows you to create sets of single choice tasks together with score editor.

Before building, the following software has to be installed
* npm
* [h5p cli](https://github.com/h5p/h5p-cli)

Also, the following H5P-Projects are necessary:
* [h5p-notation-widget](https://github.com/mnowakow/h5p-notation-widget)
* For further dependencies see library.json in root directory. All can be found on the [h5p github project page](https://github.com/h5p)

For the H5P-Package to work, execute the following prompt statements in the root directory:


1. Build the Javascript with npm
```
npm run build
```

2. Build the H5P-Packages in the parent folder
```
cd ..
h5p pack SingleChoiceScore4LMS SingleChoiceScore4LMS.h5p
```

The resulting \*.h5p package then can be installed in the LMS

## License

*H5P Single Choice Set with Score Editor* is [MIT licensed](LICENSE.md)
