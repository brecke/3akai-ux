/*!
 * Copyright 2014 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

casper.test.begin('Widget - Footer', function(test) {

    var verifyFooter = function() {
        // Verify that the footer exists on the page
        test.assertExists('#footer-container', 'The footer exists on the page');
    };

    casper.start(configUtil.tenantUI, function() {
        // Verify that the footer is showing
        casper.then(function() {
            casper.echo('# Verify that the footer shows on the page', 'INFO');
            casper.waitForSelector('#footer-container', verifyFooter);
        });
    });

    casper.run(function() {
        test.done();
    });
});
