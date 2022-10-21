# Lots of data

Using [@html-next/vertical-collection][gh-vc], we can have many many rows with very frequent updates optimally rendered.

[gh-vc]: https://github.com/html-next/vertical-collection

In this demo, 6 columns x 200 rows are updating as quickly as requestAnimationFrame allows.

Note that while the the table rows are virtualized, the data backing them is still updating.
