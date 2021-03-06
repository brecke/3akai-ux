/*!
 * Copyright 2015 Apereo Foundation (AF) Licensed under the
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

casper.test.begin('Widget - Shared With', function(test) {

    /**
     * Open the shared with modal with assertions
     *
     * @param  {String}         resourceType            The type of the resource that is being tested. Possible values are `content`, `discussion` and `folder`
     */
    var openSharedWith = function(resourceType) {
        casper.waitForSelector('#' + resourceType + '-clip-container .oae-clip-content > button', function() {
            casper.click('#' + resourceType + '-clip-container .oae-clip-content > button');
            test.assertExists('.oae-trigger-sharedwith', 'Shared with trigger exists for ' + resourceType);
            casper.click('.oae-trigger-sharedwith');
            casper.waitUntilVisible('#sharedwith-modal', function() {
                test.assertVisible('#sharedwith-modal', 'Shared with pane is showing after trigger for ' + resourceType);
                casper.click('#' + resourceType + '-clip-container .oae-clip-content > button');
            });
        });
    };

    /**
     * Verify that all elements are present in the shared with modal
     *
     * @param  {User}    user1    The first test user profile object
     * @param  {User}    user2    The second test user profile object
     */
    var verifySharedWithElements = function(user1, user2) {
        test.assertExists('#sharedwith-modal .modal-header h3', 'Verify that the modal has a header');
        test.assertSelectorHasText('#sharedwith-modal .modal-header h3', 'Shared with', 'Verify that the modal header reads \'Shared with\'');
        casper.waitForSelector('#sharedwith-modal .modal-body ul.oae-list li', function() {
            test.assertExists('#sharedwith-modal .modal-body ul.oae-list li', 'Verify that the modal shows who the resource is shared with');
            test.assertExists('#sharedwith-modal .modal-body ul.oae-list li .oae-thumbnail', 'Verify that the modal shows the pictures of the members');
            casper.waitForSelector('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user1.id + '"]', function() {
                test.assertSelectorHasText('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user1.id + '"] .oae-listitem-metadata h3', user1.displayName, 'Verify that the manager is shown in the members list');
                casper.waitForSelector('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user2.id + '"]', function() {
                    test.assertSelectorHasText('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user2.id + '"] .oae-listitem-metadata h3', user2.displayName, 'Verify that the added member is shown in the members list');
                    test.assertExists('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user2.id + '"] .oae-listitem-metadata small', 'Verify that the modal shows the tenant of the members');
                    test.assertSelectorHasText('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user2.id + '"] .oae-listitem-metadata small', 'CasperJS Tenant', 'Verify that the metadata shows the correct tenant name');
                    test.assertExists('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user1.id + '"] a[href="' + user1.profilePath + '"][target="_blank"]', 'Verify that the members have a link to their profile that opens in a new page');
                    test.assertExists('#sharedwith-modal .modal-body ul.oae-list li[data-id="' + user2.id + '"] a[href="/"][target="_blank"]', 'Verify that the the link to the current user\'s profile points to /');

                    casper.waitForSelector('#sharedwith-modal .modal-body ul.oae-list li:nth-child(9)', function() {
                        test.assertEvalEquals(function() {
                            return $('#sharedwith-modal .modal-body ul.oae-list li').length;
                        }, 9, 'Verify that there are exactly 9 users this resource is shared with');
                    });
                });
            });
        });
    };

    casper.start(configUtil.tenantUI, function() {
        // Create a couple of users to test with
        userUtil.createUsers(9, function(user1, user2, user3, user4, user5, user6, user7, user8, user9) {

            // Login with the first user
            userUtil.doLogIn(user1.username, user1.password);
            // Create a content item
            contentUtil.createFile(null, null, null, null, null, [user2.id, user3.id, user4.id, user5.id, user6.id, user7.id, user8.id, user9.id], function(err, contentProfile) {
                // Create a discussion
                discussionUtil.createDiscussion(null, null, null, null, [user2.id, user3.id, user4.id, user5.id, user6.id, user7.id, user8.id, user9.id], function(err, discussionProfile) {
                    // Create a folder
                    folderUtil.createFolder(null, null, null, null, [user1.id, user2.id, user3.id, user4.id, user5.id, user6.id, user7.id, user8.id, user9.id], function(err, folderProfile) {

                        userUtil.doLogOut();
                        userUtil.doLogIn(user2.username, user2.password);

                        // Test the shared with modal for a content item
                        casper.then(function() {
                            uiUtil.openContentProfile(contentProfile);
                        });

                        casper.then(function() {
                            casper.echo('Verify open discussion shared modal', 'INFO');
                            openSharedWith('content');
                        });

                        casper.then(function() {
                            casper.echo('Verify discussion shared elements', 'INFO');
                            verifySharedWithElements(user1, user2);
                        });

                        // Test the shared with modal for a discussion
                        casper.then(function() {
                            uiUtil.openDiscussionProfile(discussionProfile);
                        });

                        casper.then(function() {
                            casper.echo('Verify open discussion shared modal', 'INFO');
                            openSharedWith('discussion');
                        });

                        casper.then(function() {
                            casper.echo('Verify discussion shared elements', 'INFO');
                            verifySharedWithElements(user1, user2);
                        });

                        // Test the shared with modal for a folder
                        casper.then(function() {
                            uiUtil.openFolderProfile(folderProfile);
                        });

                        casper.then(function() {
                            casper.echo('Verify open discussion shared modal', 'INFO');
                            openSharedWith('folder');
                        });

                        casper.then(function() {
                            casper.echo('Verify discussion shared elements', 'INFO');
                            verifySharedWithElements(user1, user2);
                        });

                        casper.then(function() {
                            userUtil.doLogOut();
                        });
                    });
                });
            });
        });
    });

    casper.run(function() {
        test.done();
    });
});
