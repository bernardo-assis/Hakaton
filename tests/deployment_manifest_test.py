import pathlib
import unittest
import yaml

ROOT=pathlib.Path(__file__).resolve().parents[1]

class DeploymentManifestTest(unittest.TestCase):
    def test_render_requires_explicit_correctly_encoded_signer_key(self):
        render=yaml.safe_load((ROOT/'render.yaml').read_text())
        service=render['services'][0]
        variables={item['key']:item for item in service['envVars']}
        self.assertIs(variables['VAULT_SIGNER_ENCRYPTION_KEY'].get('sync'),False)
        self.assertNotIn('generateValue',variables['VAULT_SIGNER_ENCRYPTION_KEY'])
        self.assertEqual(variables['DEVNET_PAYMENTS_ENABLED']['value'],'false')

    def test_cloud_manifest_uses_same_region_private_database_and_readiness(self):
        render=yaml.safe_load((ROOT/'render.yaml').read_text())
        service,database=render['services'][0],render['databases'][0]
        self.assertEqual(service['plan'],'free')
        self.assertEqual(database['plan'],'free')
        self.assertEqual(service['region'],database['region'])
        self.assertEqual(database['ipAllowList'],[])
        self.assertEqual(service['healthCheckPath'],'/readyz')
        self.assertEqual(service['dockerContext'],'./backend')

    def test_local_compose_does_not_publish_database_or_api_or_reuse_original_volume(self):
        compose=yaml.safe_load((ROOT/'compose.demo.yml').read_text())
        self.assertEqual(compose['name'],'agentsafe-demo')
        self.assertNotIn('ports',compose['services']['postgres'])
        self.assertNotIn('ports',compose['services']['backend'])
        self.assertEqual(set(compose['volumes']),{'demo_pgdata'})
        self.assertNotIn('container_name',compose['services']['postgres'])

if __name__=='__main__':unittest.main()
