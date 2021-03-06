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

casper.test.begin('Widget - Create discussion', function(test) {

    /**
     * Open the create discussion modal with assertions
     */
    var openCreateDiscussion = function() {
        // Wait till the widget loading mechanisme is ready
        // Do this by waiting till a template has been rendered
        casper.waitForSelector('#me-clip-container .oae-clip', function() {
            casper.waitForSelector('.oae-clip-secondary .oae-clip-content > button', function() {
                casper.click('.oae-clip-secondary .oae-clip-content > button');
                test.assertExists('.oae-trigger-creatediscussion', 'create discussion trigger exists');
                casper.click('.oae-trigger-creatediscussion');
                casper.waitForSelector('.setpermissions-summary', function() {
                    test.assertVisible('#creatediscussion-modal', 'create discussion pane is showing after trigger');
                    casper.click('.oae-clip-secondary .oae-clip-content > button');
                });
            });
        });
    };

    /**
     * Goes through the workflow of creating a discussion
     */
    var verifyCreatediscussion = function(user2Id) {
        // Verify the form is present
        test.assertExists('form#creatediscussion-form', 'The create discussion form is present');
        test.assertExists('#creatediscussion-name', 'The discussion name field is present');
        test.assertExists('#creatediscussion-topic', 'The discussion topic field is present');
        // Fill the form
        casper.fill('form#creatediscussion-form', {
            'creatediscussion-name': 'Testing tools',
            'creatediscussion-topic': 'Discuss what tools you use and why.'
        }, false);

        // Verify the change permissions button is there
        test.assertExists('.setpermissions-change-permissions', 'The \'change permissions\' button is present');
        // Click the change permissions button
        casper.click('.setpermissions-change-permissions');
        // Verify the permissions radio button group and share input fields are there
        test.assertExists('#creatediscussion-permissions-container #setpermissions-container input[type="radio"]', 'The \'change permissions\' radio button group is present');
        test.assertExists('#creatediscussion-permissions-container .as-selections input', 'The \'share\' input field is present');
        // Select the public permission
        casper.click('#creatediscussion-permissions-container #setpermissions-container input[type="radio"][value="public"]', 'Select \'public\' permissions for the discussion');
        // Verify the update button is present
        test.assertExists('#setpermissions-savepermissions', 'The \'Update\' button is present');
        // Share it with the second user that was created for the test
        casper.evaluate(function(user2Id) {
            $('#creatediscussion-permissions-container .as-selections input').val(user2Id);
        }, user2Id);
        // Click the input field to trigger the list
        casper.click('#creatediscussion-permissions-container .as-selections input');
        casper.waitForSelector('.as-list li', function() {
            // Verify there is at least one item in the autosuggestions
            test.assertExists('.as-list li', 'At least one suggestion for \'' + user2Id + '\' was returned from the server');
            // Click the first suggestion in the list
            casper.click('.as-list li');
            // Click the update button
            casper.click('#setpermissions-savepermissions', 'Update the permission changes');

            // Verify the 'create discussion' button is present
            test.assertExists('#creatediscussion-create', 'The \'Create discussion\' button is present');
            // Click the submit button
            casper.click('#creatediscussion-create');
            // Wait for a second and verify that the user was redirected to the discussion profile page
            casper.waitForSelector('#discussion-clip-container h1', function() {
                test.assertVisible('#discussion-clip-container', 'Discussion profile is shown after creation of discussion');
                test.assertSelectorHasText('#discussion-clip-container h1', 'Testing tools', 'Title matches \'Testing tools\'');
            });
        });
    };

    /**
     * Verify the form validation by checking the following:
     *     - Try submitting a form without putting in a topic
     *     - Try submitting a form without putting in a title
     *     - Try submitting an empty form
     */
    var verifyCreatediscussionValidation = function() {
        casper.waitForSelector('form#creatediscussion-form', function() {
            // Test without submitting a discussion topic
            // Fill the form
            casper.fill('form#creatediscussion-form', {
                'creatediscussion-name': 'Valid discussion name',
                'creatediscussion-topic': ''
            }, false);
            // Click the submit button
            casper.click('#creatediscussion-create');
            // Verify that an error label is shown
            test.assertExists('#creatediscussion-topic-error', 'Successfully validated empty topic');

            // Test submitting without discussion title
            // Fill the form
            casper.fill('form#creatediscussion-form', {
                'creatediscussion-name': '',
                'creatediscussion-topic': 'Valid discussion topic'
            }, false);
            // Click the submit button
            casper.click('#creatediscussion-create');
            // Verify that an error label is shown
            test.assertExists('#creatediscussion-name-error', 'Successfully validated empty title');
        });
    };

    casper.start(configUtil.tenantUI, function() {
        // Create a couple of users to test creatediscussion with
        userUtil.createUsers(2, function(user1, user2) {
            // Login with that user
            userUtil.doLogIn(user1.username, user1.password);
            uiUtil.openMe();

            // Open the creatediscussion modal
            casper.then(function() {
                casper.echo('# Verify open create discussion modal', 'INFO');
                openCreateDiscussion();
            });

            // Create a discussion
            casper.then(function() {
                casper.echo('# Verify create discussion', 'INFO');
                verifyCreatediscussion(user2.username);
            });

            uiUtil.openMe();

            // Verify the discussion form validation
            casper.then(function() {
                casper.echo('# Verify create discussion validation', 'INFO');
                casper.then(openCreateDiscussion);
                casper.then(verifyCreatediscussionValidation);
            });

            // Log out at the end of the test
            userUtil.doLogOut();
        });
    });

    casper.run(function() {
        test.done();
    });
});
