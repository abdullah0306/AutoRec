from flask import Flask, request, jsonify
import requests
import os
import time
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Apify configuration
APIFY_TOKEN = 'apify_api_eAsb8ug4SjvP53qd5KLNhlklm1iqHG34tHfG'
ACTOR_ID = 'dainty_screw~contact-info-scraper--extract-business-contact-information'

# Use the direct run endpoint instead of sync endpoint
RUN_API_ENDPOINT = f"https://api.apify.com/v2/acts/{ACTOR_ID}/runs"
GET_RUN_ENDPOINT = lambda run_id: f"https://api.apify.com/v2/actor-runs/{run_id}"
GET_DATASET_ENDPOINT = lambda dataset_id: f"https://api.apify.com/v2/datasets/{dataset_id}/items"

@app.route('/api/scrape-contacts', methods=['POST'])
def scrape_contacts():
    data = request.json
    
    if not data or 'url' not in data:
        return jsonify({
            'success': False,
            'message': 'URL is required'
        }), 400
    
    # Extract parameters
    urls = data['url'] if isinstance(data['url'], list) else [data['url']]
    max_pages = data.get('maxPages', 30)
    include_email = data.get('includeEmail', True)
    include_phone = data.get('includePhone', True)
    include_social = data.get('includeSocial', True)
    
    # Log the request
    print(f"Starting contact scraping for: {urls}")
    print(f"Parameters: maxPages={max_pages}, includeEmail={include_email}, includePhone={include_phone}, includeSocial={include_social}")
    
    # Prepare the Apify request
    actor_input = {
        'startUrls': [{'url': url} for url in urls],
        'maxPagesPerCrawl': max_pages,
        'maxCrawlDepth': max_pages,
        'extractEmail': include_email,
        'extractPhone': include_phone,
        'extractSocial': include_social,
        'maxConcurrency': 10,
        'maxRequestRetries': 3,
        'proxyConfiguration': {
            'useApifyProxy': True,
            'apifyProxyGroups': ['RESIDENTIAL']
        }
    }
    
    try:
        # Start timing
        start_time = time.time()
        print(f"Starting Apify actor run at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Use the same approach as the Apify console - start a run and then poll for results
        try:
            print("Step 1: Starting Apify actor run...")
            # Start the actor run
            run_response = requests.post(
                f"{RUN_API_ENDPOINT}?token={APIFY_TOKEN}",
                json={
                    **actor_input,
                    "timeoutSecs": 300,  # 5 minute timeout - increased from default
                    "memory": 4096,     # 4GB memory - same as Apify console default
                    "build": "latest"
                },
                timeout=30  # 30 seconds timeout for this initial request
            )
            
            if run_response.status_code not in [200, 201]:
                print(f"Error starting Apify run: {run_response.status_code} - {run_response.text}")
                return jsonify({
                    'success': False,
                    'message': f"Error starting Apify run: {run_response.status_code}"
                }), 500
                
            run_data = run_response.json()
            if not run_data.get('data', {}).get('id'):
                print(f"Invalid run response: {run_data}")
                return jsonify({
                    'success': False,
                    'message': "Invalid run response from Apify"
                }), 500
                
            run_id = run_data['data']['id']
            print(f"Run started with ID: {run_id}")
            print(f"Monitor at: https://console.apify.com/actors/runs/{run_id}")
            
            # Step 2: Wait for the run to finish (with timeout)
            print("Step 2: Waiting for run to complete...")
            run_finished = False
            dataset_id = None
            wait_start_time = time.time()
            max_wait_time = 600  # 10 minutes maximum wait time - doubled to handle longer runs
            
            while not run_finished and (time.time() - wait_start_time) < max_wait_time:
                # Wait 2 seconds between status checks
                time.sleep(2)
                
                # Check run status
                status_response = requests.get(
                    f"{GET_RUN_ENDPOINT(run_id)}?token={APIFY_TOKEN}",
                    timeout=30
                )
                
                if status_response.status_code != 200:
                    print(f"Error checking run status: {status_response.status_code}")
                    continue
                    
                status_data = status_response.json()
                if not status_data.get('data'):
                    print(f"Invalid status response: {status_data}")
                    continue
                    
                status = status_data['data'].get('status')
                elapsed = time.time() - start_time
                print(f"Run status: {status} (after {elapsed:.1f}s)")
                
                if status in ['SUCCEEDED', 'FINISHED']:
                    run_finished = True
                    dataset_id = status_data['data'].get('defaultDatasetId')
                    print(f"Run completed successfully. Dataset ID: {dataset_id}")
                    break
                elif status in ['FAILED', 'ABORTED', 'TIMED-OUT']:
                    print(f"Run {status}")
                    return jsonify({
                        'success': False,
                        'message': f"Apify actor run {status}"
                    }), 500
            
            if not run_finished:
                print("Run did not finish within the maximum wait time")
                # Implement a more robust approach to check for completed results
                # We'll check multiple times with increasing delays
                max_checks = 5  # Number of times to check
                check_delays = [5, 10, 20, 30, 60]  # Delays between checks in seconds
                
                for check_index, delay in enumerate(check_delays):
                    try:
                        print(f"Check {check_index+1}/{max_checks}: Checking if run has completed...")
                        final_status_response = requests.get(
                            f"{GET_RUN_ENDPOINT(run_id)}?token={APIFY_TOKEN}",
                            timeout=30
                        )
                        
                        if final_status_response.status_code == 200:
                            final_status_data = final_status_response.json()
                            final_status = final_status_data.get('data', {}).get('status')
                            print(f"Current status: {final_status}")
                            
                            # If the run is still running, wait and check again
                            if final_status == 'RUNNING':
                                if check_index < len(check_delays) - 1:  # Not the last check
                                    print(f"Run still in progress. Waiting {delay} seconds before next check...")
                                    time.sleep(delay)
                                    continue
                                else:  # Last check and still running
                                    console_url = f"https://console.apify.com/actors/runs/{run_id}"
                                    print(f"Run is still in progress after all checks. You can view results at: {console_url}")
                                    return jsonify({
                                        'success': True,
                                        'contacts': [],
                                        'contactsPerSearch': 30,
                                        'pagination': {
                                            'currentPage': 1,
                                            'totalPages': 1,
                                            'totalResults': 0,
                                            'hasMore': False,
                                            'searchedUrl': ', '.join(urls) if isinstance(urls, list) else urls
                                        },
                                        'message': f"The scraping process is still running. You can view results directly in the Apify console: {console_url}"
                                    })
                            # If the run has completed, try to get the results
                            elif final_status in ['SUCCEEDED', 'FINISHED']:
                                print(f"Run has completed with status {final_status}. Attempting to fetch results...")
                                dataset_id = final_status_data.get('data', {}).get('defaultDatasetId')
                                
                                if dataset_id:
                                    try:
                                        # Get the dataset items
                                        print(f"Fetching dataset items from dataset {dataset_id}")
                                        dataset_response = requests.get(
                                            f"{GET_DATASET_ENDPOINT(dataset_id)}?token={APIFY_TOKEN}",
                                            timeout=30
                                        )
                                        
                                        if dataset_response.status_code == 200:
                                            # Process the dataset response
                                            raw_contacts = dataset_response.json()
                                            print(f"Successfully retrieved {len(raw_contacts)} items from Apify")
                                            
                                            if not raw_contacts or len(raw_contacts) == 0:
                                                print("No contacts found in the dataset")
                                                return jsonify({
                                                    'success': True,
                                                    'contacts': [],
                                                    'contactsPerSearch': 30,
                                                    'pagination': {
                                                        'currentPage': 1,
                                                        'totalPages': 1,
                                                        'totalResults': 0,
                                                        'hasMore': False,
                                                        'searchedUrl': ', '.join(urls) if isinstance(urls, list) else urls
                                                    },
                                                    'message': f"No contact information found on {', '.join(urls)}"
                                                })
                                            
                                            # Continue with processing the contacts
                                            processed_contacts = []
                                            
                                            # Process each contact from the API
                                            for contact in raw_contacts:
                                                if not contact:
                                                    continue
                                                
                                                # Get all emails from this contact
                                                emails = contact.get('emails', []) or []
                                                
                                                # Get all phones from this contact
                                                phones = contact.get('phones', []) or []
                                                
                                                # Also check for uncertainPhones and add them to the phones list
                                                uncertain_phones = contact.get('uncertainPhones', []) or []
                                                if uncertain_phones:
                                                    print(f"Found {len(uncertain_phones)} uncertain phones: {uncertain_phones}")
                                                    phones.extend(uncertain_phones)
                                                    
                                                # Also check for phonesUncertain (alternative field name)
                                                phones_uncertain = contact.get('phonesUncertain', []) or []
                                                if phones_uncertain:
                                                    print(f"Found {len(phones_uncertain)} phones uncertain: {phones_uncertain}")
                                                    phones.extend(phones_uncertain)
                                                
                                                # Process social media links
                                                linkedins = contact.get('linkedIns', []) or []
                                                twitters = contact.get('twitters', []) or []
                                                facebooks = contact.get('facebooks', []) or []
                                                instagrams = contact.get('instagrams', []) or []
                                                
                                                # If we have both emails and phones, create contacts with both
                                                if emails and phones:
                                                    for email in emails:
                                                        for phone in phones:
                                                            processed_contacts.append({
                                                                'name': contact.get('domain', ''),
                                                                'position': '',
                                                                'company': contact.get('domain', ''),
                                                                'email': email,
                                                                'phone': phone,
                                                                'website': contact.get('url', ''),
                                                                'linkedIn': linkedins[0] if linkedins else '',
                                                                'twitter': twitters[0] if twitters else '',
                                                                'facebook': facebooks[0] if facebooks else '',
                                                                'instagram': instagrams[0] if instagrams else '',
                                                                'address': '',
                                                                'city': '',
                                                                'state': '',
                                                                'country': '',
                                                                'zipCode': '',
                                                                'industry': '',
                                                                'companySize': '',
                                                                'foundedYear': '',
                                                                'description': '',
                                                                'source': contact.get('url', '')
                                                            })
                                                # If we only have emails, create contacts with just emails
                                                elif emails:
                                                    for email in emails:
                                                        processed_contacts.append({
                                                            'name': contact.get('domain', ''),
                                                            'position': '',
                                                            'company': contact.get('domain', ''),
                                                            'email': email,
                                                            'phone': '',
                                                            'website': contact.get('url', ''),
                                                            'linkedIn': linkedins[0] if linkedins else '',
                                                            'twitter': twitters[0] if twitters else '',
                                                            'facebook': facebooks[0] if facebooks else '',
                                                            'instagram': instagrams[0] if instagrams else '',
                                                            'address': '',
                                                            'city': '',
                                                            'state': '',
                                                            'country': '',
                                                            'zipCode': '',
                                                            'industry': '',
                                                            'companySize': '',
                                                            'foundedYear': '',
                                                            'description': '',
                                                            'source': contact.get('url', '')
                                                        })
                                                # If we only have phones, create contacts with just phones
                                                elif phones:
                                                    for phone in phones:
                                                        processed_contacts.append({
                                                            'name': contact.get('domain', ''),
                                                            'position': '',
                                                            'company': contact.get('domain', ''),
                                                            'email': '',
                                                            'phone': phone,
                                                            'website': contact.get('url', ''),
                                                            'linkedIn': linkedins[0] if linkedins else '',
                                                            'twitter': twitters[0] if twitters else '',
                                                            'facebook': facebooks[0] if facebooks else '',
                                                            'instagram': instagrams[0] if instagrams else '',
                                                            'address': '',
                                                            'city': '',
                                                            'state': '',
                                                            'country': '',
                                                            'zipCode': '',
                                                            'industry': '',
                                                            'companySize': '',
                                                            'foundedYear': '',
                                                            'description': '',
                                                            'source': contact.get('url', '')
                                                        })
                                            
                                            print(f"Processed {len(processed_contacts)} contacts")
                                            
                                            # Return the processed contacts
                                            contacts_per_search = 30
                                            return jsonify({
                                                'success': True,
                                                'contacts': processed_contacts[:contacts_per_search],
                                                'contactsPerSearch': contacts_per_search,
                                                'pagination': {
                                                    'currentPage': 1,
                                                    'totalPages': 1,
                                                    'totalResults': len(processed_contacts),
                                                    'hasMore': False,
                                                    'searchedUrl': ', '.join(urls) if isinstance(urls, list) else urls
                                                },
                                                'message': f"Found {len(processed_contacts)} contacts"
                                            })
                                    except Exception as e:
                                        print(f"Error fetching dataset after run completion: {str(e)}")
                                        # Try the next check if we have more
                                        if check_index < len(check_delays) - 1:
                                            print(f"Error fetching results. Waiting {delay} seconds before next check...")
                                            time.sleep(delay)
                                            continue
                            # If the run has failed, return an error
                            elif final_status in ['FAILED', 'ABORTED', 'TIMED-OUT']:
                                print(f"Run {final_status}")
                                return jsonify({
                                    'success': False,
                                    'message': f"Apify actor run {final_status}"
                                }), 500
                    except Exception as e:
                        print(f"Error checking run status: {str(e)}")
                        if check_index < len(check_delays) - 1:
                            print(f"Error checking status. Waiting {delay} seconds before next check...")
                            time.sleep(delay)
                            continue
                
                # Default response if we can't determine if it's still running
                console_url = f"https://console.apify.com/actors/runs/{run_id}"
                return jsonify({
                    'success': True,
                    'contacts': [],
                    'contactsPerSearch': 30,
                    'pagination': {
                        'currentPage': 1,
                        'totalPages': 1,
                        'totalResults': 0,
                        'hasMore': False,
                        'searchedUrl': ', '.join(urls) if isinstance(urls, list) else urls
                    },
                    'message': f"The scraping process is taking longer than expected. You can view results directly in the Apify console: {console_url}"
                })
            
            # If we got here, the run finished within the timeout
            if not dataset_id:
                print("No dataset ID found in the actor run response")
                return jsonify({
                    'success': False,
                    'message': "No dataset ID found"
                }), 500
                
            # Step 3: Get the dataset items
            print(f"Step 3: Fetching dataset items from dataset {dataset_id}")
            dataset_response = requests.get(
                f"{GET_DATASET_ENDPOINT(dataset_id)}?token={APIFY_TOKEN}",
                timeout=30
            )
            
            if dataset_response.status_code != 200:
                print(f"Error fetching dataset: {dataset_response.status_code} - {dataset_response.text}")
                return jsonify({
                    'success': False,
                    'message': f"Error fetching dataset: {dataset_response.status_code}"
                }), 500
                
            # Process the dataset response
            raw_contacts = dataset_response.json()
            print(f"Received {len(raw_contacts)} raw contacts from Apify")
            
            # Process the contacts
            processed_contacts = []
            
            # Process each contact from the API
            for contact in raw_contacts:
                if not contact:
                    continue
                
                # Get all emails from this contact
                emails = contact.get('emails', []) or []
                
                # Get all phones from this contact
                phones = contact.get('phones', []) or []
                
                # Also check for uncertainPhones and add them to the phones list
                uncertain_phones = contact.get('uncertainPhones', []) or []
                if uncertain_phones:
                    print(f"Found {len(uncertain_phones)} uncertain phones: {uncertain_phones}")
                    phones.extend(uncertain_phones)
                    
                # Also check for phonesUncertain (alternative field name)
                phones_uncertain = contact.get('phonesUncertain', []) or []
                if phones_uncertain:
                    print(f"Found {len(phones_uncertain)} phones uncertain: {phones_uncertain}")
                    phones.extend(phones_uncertain)
                
                # Process social media links
                linkedins = contact.get('linkedIns', []) or []
                twitters = contact.get('twitters', []) or []
                facebooks = contact.get('facebooks', []) or []
                instagrams = contact.get('instagrams', []) or []
                
                # If we have both emails and phones, create contacts with both
                if emails and phones:
                    for email in emails:
                        for phone in phones:
                            processed_contacts.append({
                                'name': contact.get('domain', ''),
                                'position': '',
                                'company': contact.get('domain', ''),
                                'email': email,
                                'phone': phone,
                                'website': contact.get('url', ''),
                                'linkedIn': linkedins[0] if linkedins else '',
                                'twitter': twitters[0] if twitters else '',
                                'facebook': facebooks[0] if facebooks else '',
                                'instagram': instagrams[0] if instagrams else '',
                                'address': '',
                                'city': '',
                                'state': '',
                                'country': '',
                                'zipCode': '',
                                'industry': '',
                                'companySize': '',
                                'foundedYear': '',
                                'description': '',
                                'source': contact.get('url', '')
                            })
                # If we only have emails, create contacts with just emails
                elif emails:
                    for email in emails:
                        processed_contacts.append({
                            'name': contact.get('domain', ''),
                            'position': '',
                            'company': contact.get('domain', ''),
                            'email': email,
                            'phone': '',
                            'website': contact.get('url', ''),
                            'linkedIn': linkedins[0] if linkedins else '',
                            'twitter': twitters[0] if twitters else '',
                            'facebook': facebooks[0] if facebooks else '',
                            'instagram': instagrams[0] if instagrams else '',
                            'address': '',
                            'city': '',
                            'state': '',
                            'country': '',
                            'zipCode': '',
                            'industry': '',
                            'companySize': '',
                            'foundedYear': '',
                            'description': '',
                            'source': contact.get('url', '')
                        })
                # If we only have phones, create contacts with just phones
                elif phones:
                    for phone in phones:
                        processed_contacts.append({
                            'name': contact.get('domain', ''),
                            'position': '',
                            'company': contact.get('domain', ''),
                            'email': '',
                            'phone': phone,
                            'website': contact.get('url', ''),
                            'linkedIn': linkedins[0] if linkedins else '',
                            'twitter': twitters[0] if twitters else '',
                            'facebook': facebooks[0] if facebooks else '',
                            'instagram': instagrams[0] if instagrams else '',
                            'address': '',
                            'city': '',
                            'state': '',
                            'country': '',
                            'zipCode': '',
                            'industry': '',
                            'companySize': '',
                            'foundedYear': '',
                            'description': '',
                            'source': contact.get('url', '')
                        })
            
            print(f"Processed {len(processed_contacts)} contacts")
            
            # Return the processed contacts
            contacts_per_search = 30
            return jsonify({
                'success': True,
                'contacts': processed_contacts[:contacts_per_search],
                'contactsPerSearch': contacts_per_search,
                'pagination': {
                    'currentPage': 1,
                    'totalPages': 1,
                    'totalResults': len(processed_contacts),
                    'hasMore': False,
                    'searchedUrl': ', '.join(urls) if isinstance(urls, list) else urls
                },
                'message': f"Found {len(processed_contacts)} contacts" if processed_contacts and len(processed_contacts) > 0 else f"No contact information found on {', '.join(urls)}"
            })
            
        except requests.exceptions.Timeout:
            print("Request to Apify timed out")
            return jsonify({
                'success': True,
                'contacts': [],
                'contactsPerSearch': 30,
                'pagination': {
                    'currentPage': 1,
                    'totalPages': 1,
                    'totalResults': 0,
                    'hasMore': False,
                    'searchedUrl': ', '.join(urls) if isinstance(urls, list) else urls
                },
                'message': "No contact information found - the scraping process timed out"
            })
            
    except Exception as e:
        print(f"Error during contact scraping: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error during contact scraping: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)