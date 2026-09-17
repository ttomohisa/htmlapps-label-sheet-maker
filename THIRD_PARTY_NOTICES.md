# Third-Party Notices

Label Sheet Maker v0.5.0 does not load third-party runtime code from a CDN or external server.

## QR encoding implementation

The embedded QR encoding implementation is adapted in part from the algorithms and error-correction structure of Project Nayuki's **QR Code generator library**. The adapted code is included directly in the single-HTML application and is redistributed under the MIT License.

Copyright © 2026 Project Nayuki. (MIT License)
https://www.nayuki.io/page/qr-code-generator-library

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Other implementation notes

Code 39 and Code 128 are implemented locally from their published symbol structures; no external barcode runtime package is bundled. Browser APIs and system fonts are used directly.

The GitHub Actions workflows reference their respective GitHub-maintained actions under the terms published by those projects.
