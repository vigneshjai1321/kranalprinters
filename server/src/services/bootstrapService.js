export async function getBootstrapPayload({ jobRepository, customerRepository }) {
  const [jobs, customers] = await Promise.all([
    jobRepository.findAll(),
    customerRepository.findAll(),
  ]);

  return {
    jobs,
    customers: customers.map((item) => item.name),
    customerLocations: Object.fromEntries(customers.map((item) => [item.name, item.location])),
  };
}
